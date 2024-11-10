import * as luxon from "luxon";
import Stripe from "stripe";
import * as _ from "lodash";

import {
  KeezApi,
  KeezInvoice,
  KeezInvoiceDetail,
  KeezItem,
  KeezParter,
} from "../keezApi";
import { throwError } from "../error";
import { COUNTRY_NAMES_BY_CODE } from "./keezConstants";
import { promiseAllBatched, promiseAllSequence } from "../functional";

export async function uploadInvoicesToKeez({
  keez,
  stripe,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoices: Stripe.Invoice[];
}) {
  const { keezItems } = await upsertKeezItems({ keez, stripeInvoices });

  console.log("uploading invoices to keez ...");
  const keezTierToItemMap = new Map<string, KeezItem>(
    keezItems.map((item) => [item.name.toLowerCase(), item])
  );

  // it seems that sometimes the invoices are not ordered by number, which keez kinda requires
  // so we need to sort them
  const stripeInvoicesOrdered = stripeInvoices.sort(
    sortStripeInvoiceBySeriesAndNumberAsc
  );

  // upload invoices to keez
  const { newKeezInvoices, existingKeezInvoices } = await createKeezInvoices({
    keez,
    stripe,
    stripeInvoicesOrdered,
    keezTierToItemMap,
  });
  await validateKeezInvoices({ keez, keezInvoices: newKeezInvoices });

  // testing - delete the invoices if they're already uploaded
  await deleteInvoicesFromKeez({
    keez,
    keezInvoices: existingKeezInvoices.sort(
      sortKeezInvoiceBySeriesAndNumberDesc
    ),
  });

  const { reverseKeezInvoices, existingReverseKeezInvoices } =
    await createReverseInvoices({
      keez,
      stripe,
      stripeInvoices: stripeInvoicesOrdered,
      keezTierToItemMap,
    });
  await validateKeezInvoices({ keez, keezInvoices: reverseKeezInvoices });

  // testing - delete the invoices if they're already uploaded
  await deleteInvoicesFromKeez({
    keez,
    keezInvoices: existingReverseKeezInvoices.sort(
      sortKeezInvoiceBySeriesAndNumberDesc
    ),
  });
}

async function upsertKeezItems({
  keez,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripeInvoices: Stripe.Invoice[];
}) {
  // check if we have items in keez for the invoices
  console.log("checking if keez has all required items ...");
  let keezItems = await keez.listItems();

  const stripeItems: Stripe.InvoiceLineItem[] = [];
  for (const invoice of stripeInvoices) {
    const items = invoice.lines.data;
    stripeItems.push(...items);
  }

  console.log(`fetched ${stripeItems.length} items from Stripe`);
  const usedTiers = [
    ...new Set(stripeItems.map((item) => item.price?.metadata.tier)),
  ].filter((s): s is string => s !== undefined);

  const unkownTiers = usedTiers.filter(
    (tier) =>
      !keezItems.find((item) => item.name.toLowerCase() === tier.toLowerCase())
  );
  if (unkownTiers.length > 0) {
    console.log(
      `unkown tiers: ${unkownTiers.join(", ")}, creating them in keez ...`
    );
    for (const tier of unkownTiers) {
      const newKeezItem = await keez.createItem({
        name: tier,
        categoryExternalId: "ITSRV", // IT Services
        currencyCode: "USD", // hard coded for now
        isActive: true,
        measureUnitId: 1,
      });
      keezItems.push(newKeezItem);
    }
    console.log("new tiers created");
  }

  return { keezItems };
}

async function createKeezInvoices({
  keez,
  stripe,
  stripeInvoicesOrdered,
  keezTierToItemMap,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoicesOrdered: Stripe.Invoice[];
  keezTierToItemMap: Map<string, KeezItem>;
}) {
  const newKeezInvoices: KeezInvoice[] = [];
  const existingKeezInvoices: KeezInvoice[] = [];
  for (const invoice of stripeInvoicesOrdered) {
    console.log(`Creating invoice ${invoice.number} ...`);
    // check if the invoice is already uploaded
    const { series, number } = getInvoiceSeriesAndNumber(invoice);
    const existingInvoice = await keez.getInvoiceBySeriesAndNumber(
      series,
      parseInt(number)
    );
    if (existingInvoice) {
      console.log(`Invoice ${invoice.number} already uploaded to Keez`);
      existingKeezInvoices.push(existingInvoice);
      continue;
    }

    const keezInvoice = await createKeezInvoiceFromStripeInvoice({
      keez,
      stripe,
      stripeInvoice: invoice,
      keezTierToItemMap,
    });
    newKeezInvoices.push(keezInvoice);
  }
  console.log(
    `finished creating ${stripeInvoicesOrdered.length} invoices in Keez`
  );

  return { newKeezInvoices, existingKeezInvoices };
}

async function createKeezInvoiceFromStripeInvoice({
  keez,
  stripeInvoice,
  keezTierToItemMap,
  isStorno = false,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoice: Stripe.Invoice;
  keezTierToItemMap: Map<string, KeezItem>;
  isStorno?: boolean;
}) {
  const exchangeRate = await getExchangeRate(stripeInvoice.currency, "RON");
  const { series, number } = getInvoiceSeriesAndNumber(stripeInvoice);

  const countryCode =
    stripeInvoice.customer_address?.country ??
    throwError("Missing country code");
  const isRomanianInvoice = countryCode === "RO";

  let countyName =
    stripeInvoice.customer_address?.state ||
    stripeInvoice.customer_address?.city ||
    "";
  if (countyName === "bucharest") {
    countyName = "Bucuresti"; // București
  }
  const partner: KeezParter = {
    partnerName: stripeInvoice.customer_name || throwError("Unnamed Customer"),
    isLegalPerson: false,
    countryCode,
    countryName:
      COUNTRY_NAMES_BY_CODE[countryCode] ?? throwError("Unknown country"),
    cityName:
      stripeInvoice.customer_address?.city || throwError("Missing city name"),
    // countyCode: "RO-DJ",
    countyName,
    addressDetails: `${stripeInvoice.customer_address?.line1} ${
      stripeInvoice.customer_address?.line2 || ""
    }`,
  };

  const comments: string[] = [];
  if (isStorno) {
    comments.push(
      `Stornare factura numarul ${series}${number} din data ${luxon.DateTime.fromSeconds(
        stripeInvoice.created
      ).toFormat("dd.MM.yyyy")}`
    );
  }

  const multiplier = isStorno ? -1 : 1;
  const invoiceDetails = stripeInvoice.lines.data.map(
    (item): KeezInvoiceDetail => {
      const tier = item.price?.metadata.tier;
      if (!tier) {
        throw new Error(`Item ${item.id} does not have a tier`);
      }

      const keezItem = keezTierToItemMap.get(tier.toLowerCase());
      if (!keezItem) {
        throw new Error(`Item ${tier} not found in Keez`);
      }

      if (item.period?.start && item.period?.end) {
        comments.push(
          `Period: ${luxon.DateTime.fromSeconds(item.period.start).toFormat(
            "MMM dd, yyyy"
          )} - ${luxon.DateTime.fromSeconds(item.period.end).toFormat(
            "MMM dd, yyyy"
          )}`
        );
      }

      const unitPriceCurrency =
        item.price?.unit_amount ?? throwError("Missing unit price");
      const vatAmountCurrency = item.tax_amounts.reduce(
        (acc, tax) => acc + tax.amount,
        0
      );
      const vatPercent = vatAmountCurrency > 0 ? 19 : 0; // hard coded for now to romanian VAT

      const itemAmount = item.amount;
      const quantity = item.quantity ?? throwError("Missing quantity");
      return {
        itemExternalId:
          keezItem.externalId ?? throwError("Missing external ID"),
        itemName: keezItem.name,
        itemDescription: item.description ?? throwError("Missing description"),
        measureUnitId: keezItem.measureUnitId ?? throwError("Missing measure"),
        quantity: multiplier * quantity,

        unitPriceCurrency: fromCents(unitPriceCurrency),
        unitPrice: fromCents(
          convertCurrency({
            value: unitPriceCurrency,
            exchangeRate,
            decimals: 4,
          })
        ),

        // VAT
        vatPercent,
        vatAmountCurrency: fromCents(vatAmountCurrency),
        vatAmount: fromCents(
          convertCurrency({
            value: vatAmountCurrency,
            exchangeRate,
            decimals: 2,
          })
        ),
        originalVatAmountCurrency: fromCents(vatAmountCurrency),
        originalVatAmount: fromCents(
          convertCurrency({
            value: vatAmountCurrency,
            exchangeRate,
            decimals: 2,
          })
        ),

        netAmountCurrency: fromCents(itemAmount),
        netAmount: fromCents(
          convertCurrency({
            value: itemAmount,
            exchangeRate,
            decimals: 2,
          })
        ),
        originalNetAmountCurrency: fromCents(itemAmount),
        originalNetAmount: fromCents(
          convertCurrency({
            value: itemAmount,
            exchangeRate,
            decimals: 2,
          })
        ),

        grossAmountCurrency: fromCents(itemAmount + vatAmountCurrency),
        grossAmount: fromCents(
          convertCurrency({
            value: itemAmount + vatAmountCurrency,
            exchangeRate,
            decimals: 2,
          })
        ),

        exciseAmountCurrency: 0,
        exciseAmount: 0,
      };
    }
  );
  if (stripeInvoice.discount?.coupon.name) {
    comments.push(`Discount: ${stripeInvoice.discount.coupon.name}`);
  }

  const vatAmountCurrency = multiplier * (stripeInvoice.tax ?? 0);
  const discountAmountCurrency =
    multiplier *
    (stripeInvoice.total_discount_amounts?.reduce(
      (acc, discount) => acc + discount.amount,
      0
    ) ?? 0);
  const hasDiscount = discountAmountCurrency !== 0;

  const netAmountCurrency =
    multiplier *
    (stripeInvoice.total_excluding_tax ?? throwError("Missing net amount"));
  const originalNetAmountCurrency =
    multiplier * (stripeInvoice.subtotal_excluding_tax ?? 0);
  const grossAmountCurrency = multiplier * (stripeInvoice.total ?? 0);

  // for romanian invoices, the reference currency HAS to be RON
  const currencyCode = isRomanianInvoice
    ? "RON"
    : stripeInvoice.currency.toUpperCase();
  const referenceCurrencyCode = stripeInvoice.currency.toUpperCase(); // must always be the same as the invoice currency

  const keezInvoice: KeezInvoice = {
    // externalId: stripeInvoice.id,
    series: isStorno ? "F2C" : series,
    number: isStorno ? undefined : parseInt(number),
    ...(isStorno && {
      storno: {
        series,
        number: parseInt(number),
        year: luxon.DateTime.fromSeconds(stripeInvoice.created).year,
      },
    }),
    documentDate: luxon.DateTime.fromSeconds(stripeInvoice.created).toFormat(
      "yyyyMMdd"
    ),
    dueDate: luxon.DateTime.fromSeconds(
      stripeInvoice.due_date ?? stripeInvoice.created
    ).toFormat("yyyyMMdd"),
    vatOnCollection: false,
    currencyCode,
    referenceCurrencyCode,
    exchangeRate: await getExchangeRate(stripeInvoice.currency, "RON"),
    paymentTypeId: 6, // stripe - https://app.keez.ro/help/api/data_payment_type.html
    partner,
    invoiceDetails,

    // Totals
    ...(hasDiscount && {
      discountType: "Value",
      discountValueOnNet: true,
      discountVatValue: 0,
      discountVatValueCurrency: 0,

      discountAmountCurrency: fromCents(discountAmountCurrency),
      discountValue: fromCents(
        convertCurrency({
          value: discountAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),
      discountGrossValueCurrency: fromCents(discountAmountCurrency),
      discountGrossValue: fromCents(
        convertCurrency({
          value: discountAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),
      discountNetValueCurrency: fromCents(discountAmountCurrency),
      discountNetValue: fromCents(
        convertCurrency({
          value: discountAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),
    }),

    netAmountCurrency: fromCents(netAmountCurrency),
    netAmount: fromCents(
      convertCurrency({
        value: netAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),
    originalNetAmountCurrency: fromCents(originalNetAmountCurrency),
    originalNetAmount: fromCents(
      convertCurrency({
        value: originalNetAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    vatAmountCurrency: fromCents(vatAmountCurrency),
    vatAmount: fromCents(
      convertCurrency({
        value: vatAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),
    originalVatAmountCurrency: fromCents(vatAmountCurrency),
    originalVatAmount: fromCents(
      convertCurrency({
        value: vatAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    grossAmountCurrency: fromCents(grossAmountCurrency),
    grossAmount: fromCents(
      convertCurrency({
        value: grossAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    exciseAmountCurrency: 0,
    exciseAmount: 0,

    comments: comments.join("\n"),
  };

  const createdInvoice = await keez.createInvoice(keezInvoice);

  console.log(
    `Invoice ${createdInvoice.series}-${createdInvoice.number} uploaded to Keez`
  );
  return createdInvoice;
}

async function validateKeezInvoices({
  keez,
  keezInvoices,
}: {
  keez: KeezApi;
  keezInvoices: KeezInvoice[];
}) {
  console.log(`Validating ${keezInvoices.length} invoices in Keez ...`);
  for (const invoice of keezInvoices) {
    await keez.validateInvoice(invoice?.externalId ?? throwError("Missing ID"));
  }
  console.log("All invoices validated in Keez");
}

function getInvoiceSeriesAndNumber(stripeInvoice: Stripe.Invoice) {
  const series = stripeInvoice.number?.split("-")[0];
  if (!series) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a series`);
  }
  const number = stripeInvoice.number?.split("-")[1];
  if (!number) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a number`);
  }

  return { series, number };
}

// Helper function to get exchange rates (dummy function for example purposes)
async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Replace with actual exchange rate API call if needed
  return 1; // Example exchange rate for non-RON currency

  // try {
  //   if (
  //     moment
  //       .utc()
  //       .subtract(1, 'day')
  //       .isSame(this._ronEurExchangeRateDate, 'day') &&
  //     !!this._ronEurExchangeRate
  //   ) {
  //     return this._ronEurExchangeRate;
  //   }

  //   const BNR_CURRENCY_EXHANGE_RATE_FEED_URL =
  //     'https://bnr.ro/nbrfxrates10days.xml';
  //   const result = await axios.get(BNR_CURRENCY_EXHANGE_RATE_FEED_URL);
  //   const xmlStr = result.data;

  //   const xml = await xml2js.parseStringPromise(xmlStr);
  //   const yesterdayRates = xml.DataSet.Body[0].Cube[1].Rate;
  //   const rateDay = xml.DataSet.Body[0].Cube[1].$.date;
  //   const eurRate = yesterdayRates.find(
  //     (rate: any) => rate.$.currency === 'EUR'
  //   );
  //   if (eurRate) {
  //     this._ronEurExchangeRate = roundFixed(parseFloat(eurRate._), 2);
  //     this._ronEurExchangeRateDate = rateDay;
  //     return this._ronEurExchangeRate;
  //   } else {
  //     throw new Error('Failed to fetch RON -> EUR exchange rate.');
  //   }
  // } catch (error: any) {
  //   throw new Error(error.message);
  // }
}

// helper function to convert a value from one currency to another
function convertCurrency({
  value,
  exchangeRate,
  decimals = 2,
}: {
  value: number;
  exchangeRate: number;
  decimals?: number;
}) {
  return _.round(value * exchangeRate, decimals);
}

// helper to transform a number from cents to dollars
function fromCents(cents: number) {
  return _.round(cents / 100, 2);
}

async function deleteInvoicesFromKeez({
  keez,
  keezInvoices,
}: {
  keez: KeezApi;
  keezInvoices: KeezInvoice[];
}) {
  console.log(`Deleting ${keezInvoices.length} invoices from Keez ...`);

  for (const invoice of keezInvoices) {
    const { series, number } = invoice;
    console.log(`Deleting invoice ${series}-${number}`);
    await keez.deleteInvoice(invoice?.externalId ?? throwError("Missing ID"));
  }
  console.log("All invoices deleted from Keez");
}

/**
 * Create reverse invoices for voided or refunded invoices.
 */
export async function createReverseInvoices({
  keez,
  stripe,
  stripeInvoices,
  keezTierToItemMap,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoices: Stripe.Invoice[];
  keezTierToItemMap: Map<string, KeezItem>;
}) {
  console.log("Creating reverse invoices ...");

  let invoicesToReverse: Stripe.Invoice[] = [];
  await promiseAllBatched(stripeInvoices, 10, async (invoice) => {
    const paymentIntent =
      typeof invoice.payment_intent === "string"
        ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
        : undefined;
    const latestCharge =
      typeof paymentIntent?.latest_charge === "string"
        ? await stripe.charges.retrieve(paymentIntent.latest_charge)
        : undefined;
    const isRefunded = latestCharge?.refunded ?? false;

    if (!invoice.paid || invoice.status !== "paid" || isRefunded) {
      invoicesToReverse.push(invoice);
    }
  });
  invoicesToReverse = invoicesToReverse.sort(
    sortStripeInvoiceBySeriesAndNumberAsc
  );
  console.log(
    `Found ${invoicesToReverse.length} invoices to reverse out of ${stripeInvoices.length}`
  );

  const reverseKeezInvoices: KeezInvoice[] = [];
  const existingReverseKeezInvoices: KeezInvoice[] = [];
  for (const invoice of invoicesToReverse) {
    const { series, number } = getInvoiceSeriesAndNumber(invoice);

    // check if the invoice is already uploaded
    const existingInvoice = await keez.getReverseInvoice({
      series: "F2C",
      client: invoice.customer_name ?? throwError("Missing customer name"),
      documentDate: luxon.DateTime.fromSeconds(
        invoice.due_date ?? invoice.created
      ).toFormat("yyyyMMdd"),
    });
    if (existingInvoice) {
      console.log(`Invoice ${invoice.number} already reversed in Keez`);
      existingReverseKeezInvoices.push(existingInvoice);
      continue;
    }

    // create reverse invoice
    const reverseInvoice = await createKeezInvoiceFromStripeInvoice({
      keez,
      stripe,
      stripeInvoice: invoice,
      keezTierToItemMap,
      isStorno: true,
    });
    reverseKeezInvoices.push(reverseInvoice);
    console.log(`Created reverse invoice for ${series}-${number}`);
  }

  return { reverseKeezInvoices, existingReverseKeezInvoices };
}

function sortStripeInvoiceBySeriesAndNumberAsc(
  a: Stripe.Invoice,
  b: Stripe.Invoice
) {
  const aNumber = parseInt(getInvoiceSeriesAndNumber(a).number);
  const bNumber = parseInt(getInvoiceSeriesAndNumber(b).number);
  return aNumber - bNumber;
}

function sortKeezInvoiceBySeriesAndNumberDesc(a: KeezInvoice, b: KeezInvoice) {
  if (!a.number || !b.number) {
    return 0;
  }

  return b.number - a.number;
}

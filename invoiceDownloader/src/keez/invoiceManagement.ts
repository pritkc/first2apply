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

export async function uploadInvoicesToKeez({
  keez,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripeInvoices: Stripe.Invoice[];
}) {
  const { keezItems } = await upsertKeezItems({ keez, stripeInvoices });

  console.log("uploading invoices to keez ...");
  const keezTierToItemMap = new Map<string, KeezItem>(
    keezItems.map((item) => [item.name.toLowerCase(), item])
  );

  // it seems that sometimes the invoices are not ordered by number, which keez kinda requires
  // so we need to sort them
  const stripeInvoicesOrdered = stripeInvoices.sort((a, b) => {
    const aNumber = parseInt(getInvoiceSeriesAndNumber(a).number);
    const bNumber = parseInt(getInvoiceSeriesAndNumber(b).number);
    return aNumber - bNumber;
  });

  // upload invoices to keez
  for (const invoice of stripeInvoicesOrdered) {
    console.log(`Uploading invoice ${invoice.number}`);
    await createKeezInvoiceFromStripeInvoice({
      keez,
      stripeInvoice: invoice,
      keezTierToItemMap,
    });
  }
  console.log(
    `finished uploading ${stripeInvoicesOrdered.length} invoices to Keez`
  );

  // const invoicesToDelete = [...stripeInvoicesOrdered].reverse(); // need to delete the newest invoices first
  // await deleteInvoicesFromKeez({ keez, stripeInvoices: invoicesToDelete }); // useful for testing
  await validateKeezInvoices({ keez, stripeInvoices: stripeInvoicesOrdered });
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

async function createKeezInvoiceFromStripeInvoice({
  keez,
  stripeInvoice,
  keezTierToItemMap,
}: {
  keez: KeezApi;
  stripeInvoice: Stripe.Invoice;
  keezTierToItemMap: Map<string, KeezItem>;
}) {
  const exchangeRate = await getExchangeRate(stripeInvoice.currency, "RON");

  const series = stripeInvoice.number?.split("-")[0];
  if (!series) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a series`);
  }
  const number = stripeInvoice.number?.split("-")[1];
  if (!number) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a number`);
  }

  // check if the invoice is already uploaded
  const existingInvoice = await keez.getInvoiceBySeriesAndNumber(
    series,
    parseInt(number)
  );
  if (existingInvoice) {
    console.log(`Invoice ${stripeInvoice.number} already uploaded to Keez`);
    return;
  }

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
    // externalId:
    //   typeof stripeInvoice.customer === "string"
    //     ? stripeInvoice.customer
    //     : undefined,
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
      return {
        itemExternalId:
          keezItem.externalId ?? throwError("Missing external ID"),
        itemName: keezItem.name,
        itemDescription: item.description ?? throwError("Missing description"),
        measureUnitId: keezItem.measureUnitId ?? throwError("Missing measure"),
        quantity: item.quantity ?? throwError("Missing quantity"),

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

        netAmountCurrency: fromCents(item.amount),
        netAmount: fromCents(
          convertCurrency({
            value: item.amount,
            exchangeRate,
            decimals: 2,
          })
        ),
        originalNetAmountCurrency: fromCents(item.amount),
        originalNetAmount: fromCents(
          convertCurrency({
            value: item.amount,
            exchangeRate,
            decimals: 2,
          })
        ),

        grossAmountCurrency: fromCents(item.amount + vatAmountCurrency),
        grossAmount: fromCents(
          convertCurrency({
            value: item.amount + vatAmountCurrency,
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

  const vatAmountCurrency = stripeInvoice.tax ?? 0;
  const hasDiscount = stripeInvoice.total_discount_amounts?.length ?? 0 > 0;
  const discountAmountCurrency =
    stripeInvoice.total_discount_amounts?.reduce(
      (acc, discount) => acc + discount.amount,
      0
    ) ?? 0;

  const netAmountCurrency =
    stripeInvoice.total_excluding_tax ?? throwError("Missing net amount");
  const originalNetAmountCurrency = stripeInvoice.subtotal_excluding_tax ?? 0;

  // for romanian invoices, the reference currency HAS to be RON
  const currencyCode = isRomanianInvoice
    ? "RON"
    : stripeInvoice.currency.toUpperCase();
  const referenceCurrencyCode = stripeInvoice.currency.toUpperCase(); // must always be the same as the invoice currency

  const keezInvoice: KeezInvoice = {
    // externalId: stripeInvoice.id,
    series,
    number: parseInt(number),
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

    grossAmountCurrency: fromCents(
      stripeInvoice.total ?? throwError("Missing gross")
    ),
    grossAmount: fromCents(
      convertCurrency({
        value: stripeInvoice.total,
        exchangeRate,
        decimals: 2,
      })
    ),

    exciseAmountCurrency: 0,
    exciseAmount: 0,

    comments: comments.join("\n"),
  };

  await keez.createInvoice(keezInvoice);

  console.log(`Invoice ${stripeInvoice.number} uploaded to Keez`);
}

// 203-305;
async function validateKeezInvoices({
  keez,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripeInvoices: Stripe.Invoice[];
}) {
  console.log(`Validating ${stripeInvoices.length} invoices in Keez ...`);
  for (const invoice of stripeInvoices) {
    const { series, number } = getInvoiceSeriesAndNumber(invoice);
    console.log(`Validating invoice ${series}-${number}`);

    // check if the invoice is already uploaded
    const existingInvoice = await keez.getInvoiceBySeriesAndNumber(
      series,
      parseInt(number)
    );
    if (!existingInvoice || !existingInvoice.externalId) {
      throw new Error(`Invoice ${series}-${number} not found in Keez`);
    }
    await keez.validateInvoice(existingInvoice.externalId);
  }
}

async function deleteInvoicesFromKeez({
  keez,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripeInvoices: Stripe.Invoice[];
}) {
  console.log(`Deleting ${stripeInvoices.length} invoices from Keez ...`);

  for (const invoice of stripeInvoices) {
    const { series, number } = getInvoiceSeriesAndNumber(invoice);
    console.log(`Deleting invoice ${series}-${number}`);

    // check if the invoice is already uploaded
    const existingInvoice = await keez.getInvoiceBySeriesAndNumber(
      series,
      parseInt(number)
    );
    if (!existingInvoice || !existingInvoice.externalId) {
      console.warn(`Invoice ${series}-${number} not found in Keez`);
      continue;
    }
    await keez.deleteInvoice(existingInvoice.externalId);
  }
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

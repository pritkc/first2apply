import axios from "axios";
import urljoin from "url-join";

export type KeezApiConfig = {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  clientId: string;
};

type KeezAccessToken = {
  token_type: string;
  access_token: string;
  expires_in: number; // in seconds
};

/**
 * Wrapper over the Keez REST API.
 */
export class KeezApi {
  private _accessToken?: KeezAccessToken;

  /**
   * Class constructor.
   */
  constructor(private _config: KeezApiConfig) {}

  /**
   * List all items from Keez.
   */
  async listItems(): Promise<KeezItem[]> {
    const accessToken = await this._getAccessToken();

    const items = await this._apiCall<KeezItem[]>({
      method: "get",
      path: `/api/v1.0/public-api/${this._config.clientId}/items`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
    });

    return items;
  }

  /**
   * Create a new item in Keez.
   */
  async createItem(
    item: Pick<
      KeezItem,
      | "name"
      | "categoryExternalId"
      | "currencyCode"
      | "isActive"
      | "measureUnitId"
    >
  ): Promise<KeezItem> {
    const accessToken = await this._getAccessToken();

    const { externalId: newItemId } = await this._apiCall<{
      externalId: string;
    }>({
      method: "post",
      path: `/api/v1.0/public-api/${this._config.clientId}/items`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      body: {
        name: item.name,
        categoryExternalId: item.categoryExternalId,
        currencyCode: item.currencyCode,
        isActive: item.isActive,
        measureUnitId: item.measureUnitId,
      },
    });

    return this.getItemByExternalId(newItemId);
  }

  /**
   * Get an item by its external id.
   */
  async getItemByExternalId(externalId: string): Promise<KeezItem> {
    const accessToken = await this._getAccessToken();

    const item = await this._apiCall<KeezItem>({
      method: "get",
      path: `/api/v1.0/public-api/${this._config.clientId}/items/${externalId}`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
    });

    return item;
  }

  /**
   * Create a new invoice in Keez.
   */
  async createInvoice(invoice: KeezInvoice): Promise<KeezInvoice> {
    const accessToken = await this._getAccessToken();
    const { externalId: newInvoiceId } = await this._apiCall<{
      externalId: string;
    }>({
      method: "post",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      body: invoice,
    });

    return this.getInvoiceByExternalId(newInvoiceId);
  }

  /**
   * Get an invoice by its external id.
   */
  async getInvoiceByExternalId(externalId: string): Promise<KeezInvoice> {
    const accessToken = await this._getAccessToken();

    const invoice = await this._apiCall<KeezInvoice>({
      method: "get",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices/${externalId}`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
    });

    return {
      ...invoice,
      externalId,
    };
  }

  /**
   * Get invoice by series and number.
   */
  async getInvoiceBySeriesAndNumber(
    series: string,
    number: number
  ): Promise<KeezInvoice | null> {
    const accessToken = await this._getAccessToken();

    const { data: invoices } = await this._apiCall<{
      data: KeezInvoice[];
    }>({
      method: "get",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      params: {
        filter: encodeURIComponent(
          `series[eq]:${series} AND number[eq]:${number}`
        ),
      },
    });

    if (invoices.length === 0) {
      return null;
    }

    return invoices[0];
  }

  /**
   * Try to find a reverse invoice for the given invoice.
   */
  async getReverseInvoice({
    series,
    client,
    documentDate,
  }: {
    series: string;
    client: string;
    documentDate: string;
  }): Promise<KeezInvoice | null> {
    const accessToken = await this._getAccessToken();

    const { data: invoices } = await this._apiCall<{
      data: KeezInvoice[];
    }>({
      method: "get",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      params: {
        filter: encodeURIComponent(
          `series[eq]:${series} AND partnerName[like]:${client} AND documentDate[eq]:${documentDate}`
        ),
      },
    });

    if (invoices.length === 0) {
      return null;
    }

    return invoices[0];
  }

  /**
   * Validate the invoice.
   */
  async validateInvoice(externalId: string): Promise<void> {
    const accessToken = await this._getAccessToken();

    await this._apiCall<void>({
      method: "post",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices/valid`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      body: {
        externalId,
      },
    });

    return;
  }

  /**
   * Delete an invoice by its external id.
   */
  async deleteInvoice(externalId: string): Promise<void> {
    const accessToken = await this._getAccessToken();

    await this._apiCall<void>({
      method: "delete",
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      headers: {
        Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
      },
      body: {
        externalId,
      },
    });
  }

  /**
   * Get the access token either from the cache or by requesting a new one.
   */
  private async _getAccessToken(): Promise<KeezAccessToken> {
    if (this._accessToken) {
      return this._accessToken;
    }

    const response = await this._apiCall<KeezAccessToken>({
      method: "post",
      path: "/idp/connect/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        // client_eid: this._config.clientId,
        // application_id: this._config.apiKey,
        // secret: this._config.apiSecret,

        grant_type: "client_credentials",
        scope: "public-api",
        client_id: `app${this._config.apiKey}`,
        client_secret: this._config.apiSecret,
      }).toString(),
    });

    this._accessToken = response;
    return this._accessToken;
  }

  /**
   * Generic http api call.
   */
  private async _apiCall<T>({
    method = "get",
    path,
    headers,
    body,
    params,
  }: {
    method?: "get" | "post" | "put" | "delete";
    path: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
  }): Promise<T> {
    try {
      const url = urljoin(this._config.apiUrl, path);
      const res = await axios.request({
        method,
        url,
        headers,
        data: body,
        params,
      });

      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Error calling Keez API ${method.toUpperCase()} ${path}: ${JSON.stringify(
            error.response?.data
          )}
          
${JSON.stringify(error.config?.data ?? {}, null, 2)}`
        );
      }

      throw error;
    }
  }
}

export type KeezItem = {
  externalId?: string; // Optional: Keez identifier for the item
  name: string; // Required: Name of the product/service (max 500 characters)
  categoryExternalId: string; // Required: Keez identifier for the category
  currencyCode: string; // Required: Currency code (3 characters, ISO 4217)
  isActive: boolean; // Required: Status of the item (true for active, false for inactive)
  measureUnitId?: number; // Optional: Unit of measure (refer to Measure Unit nomenclature)
  lastPrice?: number; // Optional: Last price of the item from the most recent invoice
  hasExcise?: boolean; // Optional: Indicates if the item is excisable
  exciseValue?: number; // Optional: Value of the excise (numeric with up to 6 decimal places)
};

export type KeezInvoice = {
  externalId?: string; // Optional: Keez identifier for the invoice
  series: string; // Required: Invoice series
  number?: number; // Optional: Invoice number, auto-generated if not provided
  documentDate: string; // Required: Invoice date in 'yyyyMMdd' format
  comments?: string; // Optional: Comments for the invoice
  dueDate: string; // Required: Due date in 'yyyyMMdd' format
  vatOnCollection: boolean; // Required: VAT on collection (true/false)
  storno?: {
    series: string;
    number: number;
    year: number;
  }; // Optional: Reference to the invoice being canceled
  currencyCode: string; // Required: Currency code (ISO 4217)
  referenceCurrencyCode?: string; // Optional: Reference currency code (ISO 4217)
  exchangeRate?: number; // Optional: Exchange rate in RON if currency is not RON
  paymentTypeId: number; // Required: Payment type ID
  partner: KeezParter; // Required: Client identification data
  invoiceDetails: KeezInvoiceDetail[]; // Required: Invoice details

  discountType?: "Percent" | "Value"; // Optional: Type of global discount
  discountPercent?: number; // Optional: Discount percentage (if discountType is Percent)
  discountValueOnNet?: boolean; // Optional: Applies discount to net value (true/false)

  originalNetAmount: number; // Required: Original net amount in RON
  originalVatAmount: number; // Required: Original VAT amount in RON
  discountNetValue?: number; // Optional: Net discount value in RON (if discountType is provided)
  discountGrossValue?: number; // Optional: Gross discount value in RON (if discountType is provided)
  discountVatValue?: number; // Optional: VAT discount value in RON (if discountType is provided)

  netAmount: number; // Required: Total net amount in RON (Net - Discount)
  vatAmount: number; // Required: Total VAT amount in RON (VAT - VAT discount)
  grossAmount: number; // Required: Total gross amount in RON (Net + VAT)
  exciseAmount?: number; // Optional: Total excise amount in RON

  originalNetAmountCurrency?: number; // Optional: Original net amount in invoice currency
  originalVatAmountCurrency?: number; // Optional: Original VAT amount in invoice currency
  discountNetValueCurrency?: number; // Optional: Net discount value in invoice currency
  discountGrossValueCurrency?: number; // Optional: Gross discount value in invoice currency
  discountVatValueCurrency?: number; // Optional: VAT discount value in invoice currency

  netAmountCurrency?: number; // Optional: Total net amount in invoice currency (Net - Discount)
  vatAmountCurrency?: number; // Optional: Total VAT amount in invoice currency (VAT - VAT discount)
  grossAmountCurrency?: number; // Optional: Total gross amount in invoice currency (Net + VAT)
  exciseAmountCurrency?: number; // Optional: Total excise amount in invoice currency
};

export type KeezInvoiceDetail = {
  itemExternalId: string; // Required: Keez identifier for the item
  itemName?: string; // Optional: Name of the item
  itemDescription?: string; // Optional: Description of the item
  measureUnitId: number; // Required: Unit of measure ID
  quantity: number; // Required: Quantity of the item (2 decimal places)
  unitPrice: number; // Required: Item price in RON (4 decimal places)
  unitPriceCurrency: number; // Required: Item price in invoice currency (4 decimal places)
  vatPercent?: number; // Optional: VAT percentage (2 decimal places)

  discountType?: "Percent" | "Value"; // Optional: Type of discount
  discountPercent?: number; // Optional: Discount percentage if discountType is Percent
  discountValueOnNet?: boolean; // Optional: Indicates if discount applies to net or gross value

  originalNetAmount: number; // Required: Original net amount in RON (2 decimal places)
  originalVatAmount: number; // Required: Original VAT amount in RON (2 decimal places)
  discountNetValue?: number; // Optional: Net discount amount in RON (2 decimal places)
  discountGrossValue?: number; // Optional: Gross discount amount in RON (2 decimal places)
  discountVatValue?: number; // Optional: VAT discount amount in RON (2 decimal places)

  netAmount: number; // Required: Total net amount in RON after discount (2 decimal places)
  vatAmount: number; // Required: Total VAT amount in RON after discount (2 decimal places)
  grossAmount: number; // Required: Total gross amount in RON (2 decimal places)
  exciseAmount?: number; // Optional: Total excise amount in RON (2 decimal places)

  originalNetAmountCurrency?: number; // Optional: Original net amount in invoice currency (2 decimal places)
  originalVatAmountCurrency?: number; // Optional: Original VAT amount in invoice currency (2 decimal places)
  discountNetValueCurrency?: number; // Optional: Net discount value in invoice currency (2 decimal places)
  discountGrossValueCurrency?: number; // Optional: Gross discount value in invoice currency (2 decimal places)
  discountVatValueCurrency?: number; // Optional: VAT discount value in invoice currency (2 decimal places)

  netAmountCurrency?: number; // Optional: Total net amount in invoice currency (2 decimal places)
  vatAmountCurrency?: number; // Optional: Total VAT amount in invoice currency (2 decimal places)
  grossAmountCurrency?: number; // Optional: Total gross amount in invoice currency (2 decimal places)
  exciseAmountCurrency?: number; // Optional: Total excise amount in invoice currency (2 decimal places)
};

export type KeezParter = {
  externalId?: string; // Optional: Keez identifier for the partner, required only if known
  isLegalPerson: boolean; // Required: Defines if the partner is a legal entity
  partnerName: string; // Required: Name of the partner
  identificationNumber?: string; // Optional: Partner's CNP (ID number for individuals)
  countryCode: string; // Required: Country code (ISO 3166-1 Alpha-2)
  countryName: string; // Required: Country name
  countyCode?: string; // Optional: County code (required if countyName is missing and country is Romania)
  countyName?: string; // Optional: County name (required if countyCode is missing and country is Romania)
  cityName: string; // Required: Name of the city
  addressDetails: string; // Required: Address details
};

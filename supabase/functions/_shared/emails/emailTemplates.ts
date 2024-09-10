/**
 * Base email template type
 */
export type EmailTemplateBase = {
  type: EmailTemplateType;
  templateId: string; // This will store the template ID
};

export enum EmailTemplateType {
  searchParsingFailure = "searchParsingFailure",
}

export type SearchParsingFailureEmailTemplate = EmailTemplateBase & {
  type: EmailTemplateType.searchParsingFailure;
  templateId: "pq3enl6v15rg2vwr";
  payload: {
    link_title: string;
    link_url: string;
    site_name: string;
  };
};

export type EmailTemplate = SearchParsingFailureEmailTemplate;

export type CurrencyCode = string;

export interface Currency {
  code: CurrencyCode;
  name: string;
  flag?: string;
}

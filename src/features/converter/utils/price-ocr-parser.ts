const CURRENCY_SYMBOLS = "[$€£¥₹₩₺]";
const NUMBER_PATTERN = "\\d+(?:[.,]\\d{1,4})?";

// Common ISO 4217 currency codes, as printed on price tags/receipts (e.g. "100 EUR", "49USD").
// Uppercase-only: OCR'd price tags print codes in caps, and matching lowercase would collide
// with ordinary English words that happen to be 3 letters (e.g. "try", "all", "cad").
const CURRENCY_CODES = "USD|EUR|GBP|JPY|CNY|RUB|CHF|CAD|AUD|NZD|INR|BRL|MXN|ZAR|TRY|AED|SAR|SEK|NOK|DKK|PLN|CZK|HUF|ILS|KRW|SGD|HKD|THB|IDR|MYR|PHP|VND|UAH|KZT|EGP|NGN";

const PREFIX_REGEX = new RegExp(`${CURRENCY_SYMBOLS}\\s*(${NUMBER_PATTERN})`);
const SUFFIX_REGEX = new RegExp(`(${NUMBER_PATTERN})\\s*${CURRENCY_SYMBOLS}`);

const CODE_PREFIX_REGEX = new RegExp(`\\b(?:${CURRENCY_CODES})\\s*(${NUMBER_PATTERN})`);
const CODE_SUFFIX_REGEX = new RegExp(`(${NUMBER_PATTERN})\\s*(?:${CURRENCY_CODES})`);

// eslint-disable-next-line prefer-regex-literals
const PLAIN_DECIMAL_REGEX = new RegExp(`\\b(\\d+[.,]\\d{1,4})\\b`);

function parseDecimalString(str: string): number {
  if (str.includes(",") && !str.includes(".")) {
    return Number.parseFloat(str.replace(",", "."));
  }
  return Number.parseFloat(str.replace(/,/g, ""));
}

export function parsePriceFromOcrText(text: string): number | null {
  let match = PREFIX_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  match = SUFFIX_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  match = CODE_PREFIX_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  match = CODE_SUFFIX_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  match = PLAIN_DECIMAL_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  return null;
}

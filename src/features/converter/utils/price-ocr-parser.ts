const CURRENCY_SYMBOLS = "[$€£¥₹₩₺]";
const NUMBER_PATTERN = "\\d+(?:[.,]\\d{1,4})?";

const PREFIX_REGEX = new RegExp(`${CURRENCY_SYMBOLS}\\s*(${NUMBER_PATTERN})`);
// eslint-disable-next-line prefer-regex-literals
const SUFFIX_REGEX = new RegExp(`(${NUMBER_PATTERN})\\s*${CURRENCY_SYMBOLS}`);
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

  match = PLAIN_DECIMAL_REGEX.exec(text);
  if (match) {
    return parseDecimalString(match[1]);
  }

  return null;
}

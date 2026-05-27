type RatesMap = Record<string, number>;
type CustomRatesMap = Record<string, number>;

export function getExchangeRate({
  from,
  to,
  rates,
  customRates,
}: {
  from: string;
  to: string;
  rates: RatesMap;
  customRates: CustomRatesMap;
}): number {
  if (from === to) {
    return 1;
  }
  const directPair = `${from}_${to}`;
  const inversePair = `${to}_${from}`;

  if (customRates[directPair] !== undefined) {
    return customRates[directPair];
  }
  if (customRates[inversePair] !== undefined && customRates[inversePair] > 0) {
    return 1 / customRates[inversePair];
  }

  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) {
    return 0;
  }
  return toRate / fromRate;
}

export function convertCurrency({
  amountStr,
  from,
  to,
  rates,
  customRates,
}: {
  amountStr: string;
  from: string;
  to: string;
  rates: RatesMap;
  customRates: CustomRatesMap;
}): number {
  let amount = Number.parseFloat(amountStr.replace(/,/g, "."));
  if (Number.isNaN(amount)) {
    amount = 0;
  }

  if (from === to) {
    return amount;
  }

  const directPair = `${from}_${to}`;
  const inversePair = `${to}_${from}`;

  if (customRates[directPair] !== undefined) {
    return amount * customRates[directPair];
  }
  if (customRates[inversePair] !== undefined && customRates[inversePair] > 0) {
    return amount / customRates[inversePair];
  }

  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) {
    return 0;
  }

  return (amount / fromRate) * toRate;
}

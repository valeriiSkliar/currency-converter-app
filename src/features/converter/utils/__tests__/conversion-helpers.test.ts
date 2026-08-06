import { convertCurrency, getExchangeRate } from "../conversion-helpers";

describe("conversion-helpers", () => {
  // Rates map normalized relative to USD (units of currency per 1 USD):
  // USD = 1
  // EUR = 0.92 (0.92 EUR per 1 USD)
  // UAH = 41.2 (41.2 UAH per 1 USD)
  // BTC = 1 / 72792.03226308 (approx 0.000013737768 BTC per 1 USD)
  // ETH = 1 / 3500 (approx 0.000285714 ETH per 1 USD)
  const rates = {
    USD: 1,
    EUR: 0.92,
    UAH: 41.2,
    BTC: 1 / 72792.03226308,
    ETH: 1 / 3500,
  };

  describe("getExchangeRate", () => {
    it("returns 1 when converting same currency", () => {
      expect(getExchangeRate({ from: "EUR", to: "EUR", rates, customRates: {} })).toBe(1);
    });

    it("calculates correct rate between fiat currencies", () => {
      const rate = getExchangeRate({ from: "EUR", to: "USD", rates, customRates: {} });
      expect(rate).toBeCloseTo(1 / 0.92, 5);
    });

    it("calculates correct rate from fiat to crypto (EUR to BTC)", () => {
      const rate = getExchangeRate({ from: "EUR", to: "BTC", rates, customRates: {} });
      // 1 EUR in BTC = (1 / 72792.03226308) / 0.92
      const expected = (1 / 72792.03226308) / 0.92;
      expect(rate).toBeCloseTo(expected, 10);
    });

    it("calculates correct rate from crypto to fiat (BTC to EUR)", () => {
      const rate = getExchangeRate({ from: "BTC", to: "EUR", rates, customRates: {} });
      // 1 BTC in EUR = 72792.03226308 * 0.92 = 66968.66968
      const expected = 72792.03226308 * 0.92;
      expect(rate).toBeCloseTo(expected, 4);
    });

    it("uses custom rate direct pair if present", () => {
      const customRates = { EUR_BTC: 0.00002 };
      const rate = getExchangeRate({ from: "EUR", to: "BTC", rates, customRates });
      expect(rate).toBe(0.00002);
    });

    it("uses custom rate inverse pair if present", () => {
      const customRates = { BTC_EUR: 70000 };
      const rate = getExchangeRate({ from: "EUR", to: "BTC", rates, customRates });
      expect(rate).toBe(1 / 70000);
    });
  });

  describe("convertCurrency", () => {
    it("converts 100 EUR to USD correctly", () => {
      const result = convertCurrency({ amountStr: "100", from: "EUR", to: "USD", rates, customRates: {} });
      expect(result).toBeCloseTo(100 / 0.92, 5);
    });

    it("converts 100 EUR to BTC correctly without multiplying by BTC price", () => {
      const result = convertCurrency({ amountStr: "100", from: "EUR", to: "BTC", rates, customRates: {} });
      // 100 EUR = (100 / 0.92) USD = 108.69565 USD
      // 108.69565 / 72792.03226308 BTC = approx 0.001493235 BTC
      const expected = (100 / 0.92) / 72792.03226308;
      expect(result).toBeCloseTo(expected, 8);
      expect(result).toBeLessThan(0.01); // definitely not millions!
    });

    it("converts 1 BTC to EUR correctly", () => {
      const result = convertCurrency({ amountStr: "1", from: "BTC", to: "EUR", rates, customRates: {} });
      const expected = 72792.03226308 * 0.92;
      expect(result).toBeCloseTo(expected, 4);
    });

    it("converts 1 BTC to ETH correctly", () => {
      const result = convertCurrency({ amountStr: "1", from: "BTC", to: "ETH", rates, customRates: {} });
      // 1 BTC ($72,792.03) in ETH ($3,500) = 72792.03 / 3500 = 20.7977 ETH
      const expected = 72792.03226308 / 3500;
      expect(result).toBeCloseTo(expected, 4);
    });
  });
});

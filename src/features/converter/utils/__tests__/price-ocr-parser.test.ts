import { parsePriceFromOcrText } from "../price-ocr-parser";

describe("parsePriceFromOcrText", () => {
  it("extracts price with dollar symbol prefix", () => {
    expect(parsePriceFromOcrText("Croissant $78.42")).toBe(78.42);
  });

  it("extracts price with euro symbol prefix and comma decimal", () => {
    expect(parsePriceFromOcrText("Prix: €12,50")).toBe(12.5);
  });

  it("extracts price with symbol suffix", () => {
    expect(parsePriceFromOcrText("Total 45.00$")).toBe(45.0);
  });

  it("extracts plain decimal number when no symbol present", () => {
    expect(parsePriceFromOcrText("Total 99.99")).toBe(99.99);
  });

  it("prefers symbol-prefixed price over a plain number", () => {
    expect(parsePriceFromOcrText("3 items $5.00 each")).toBe(5.0);
  });

  it("returns null when text contains no price-like pattern", () => {
    expect(parsePriceFromOcrText("Coffee and Cake")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePriceFromOcrText("")).toBeNull();
  });

  it("handles price surrounded by other text", () => {
    expect(parsePriceFromOcrText("Menu Espresso £3.50 per cup")).toBe(3.5);
  });

  it("extracts whole-number price with a 3-letter currency code suffix", () => {
    expect(parsePriceFromOcrText("100EUR")).toBe(100);
  });

  it("extracts price with a 3-letter currency code suffix despite trailing OCR noise", () => {
    expect(parsePriceFromOcrText("100EURc")).toBe(100);
    expect(parsePriceFromOcrText("100EUR-")).toBe(100);
  });

  it("extracts price with a spaced 3-letter currency code suffix", () => {
    expect(parsePriceFromOcrText("Total 49 USD")).toBe(49);
  });

  it("extracts price with a 3-letter currency code prefix", () => {
    expect(parsePriceFromOcrText("EUR 100")).toBe(100);
  });

  it("does not treat an unrelated 3-letter word next to a number as a currency code", () => {
    expect(parsePriceFromOcrText("Room 100 ABC")).toBeNull();
  });
});

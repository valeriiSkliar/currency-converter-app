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
});

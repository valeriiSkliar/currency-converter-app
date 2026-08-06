import { isVersionOutdated } from "../version-helpers";

describe("version-helpers", () => {
  describe("isVersionOutdated", () => {
    it("returns false when versions are equal", () => {
      expect(isVersionOutdated("1.0.0", "1.0.0")).toBe(false);
      expect(isVersionOutdated("1.2.3", "1.2.3")).toBe(false);
    });

    it("returns true when current version is lower than minimum version", () => {
      expect(isVersionOutdated("1.0.0", "1.0.1")).toBe(true);
      expect(isVersionOutdated("1.0.0", "1.1.0")).toBe(true);
      expect(isVersionOutdated("1.0.0", "2.0.0")).toBe(true);
      expect(isVersionOutdated("1.2.5", "1.3.0")).toBe(true);
    });

    it("returns false when current version is higher than minimum version", () => {
      expect(isVersionOutdated("1.0.1", "1.0.0")).toBe(false);
      expect(isVersionOutdated("1.1.0", "1.0.0")).toBe(false);
      expect(isVersionOutdated("2.0.0", "1.0.0")).toBe(false);
      expect(isVersionOutdated("2.1.0", "2.0.9")).toBe(false);
    });

    it("handles version prefixes 'v' or whitespace", () => {
      expect(isVersionOutdated("v1.0.0", "1.0.1")).toBe(true);
      expect(isVersionOutdated(" 1.0.0 ", "v1.0.0")).toBe(false);
    });

    it("handles empty or invalid inputs gracefully", () => {
      expect(isVersionOutdated("", "1.0.0")).toBe(false);
      expect(isVersionOutdated("1.0.0", "")).toBe(false);
    });
  });
});

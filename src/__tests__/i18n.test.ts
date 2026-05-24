import { resources } from "@/lib/i18n/resources";

describe("i18n resources", () => {
  it("has en, ru and ar locales", () => {
    expect(resources).toHaveProperty("en");
    expect(resources).toHaveProperty("ru");
    expect(resources).toHaveProperty("ar");
  });

  it("en has required converter keys", () => {
    const t = resources.en.translation;
    expect(t.converter.title).toBeDefined();
    expect(t.converter.from).toBeDefined();
    expect(t.converter.to).toBeDefined();
    expect(t.converter.swap).toBeDefined();
  });

  it("ru has required converter keys", () => {
    const t = resources.ru.translation;
    expect(t.converter.title).toBeDefined();
    expect(t.converter.from).toBeDefined();
    expect(t.converter.to).toBeDefined();
    expect(t.converter.swap).toBeDefined();
  });

  it("ru and ar have same top-level keys as en", () => {
    const enKeys = JSON.stringify(Object.keys(resources.en.translation).sort());
    expect(JSON.stringify(Object.keys(resources.ru.translation).sort())).toBe(enKeys);
    expect(JSON.stringify(Object.keys(resources.ar.translation).sort())).toBe(enKeys);
  });
});

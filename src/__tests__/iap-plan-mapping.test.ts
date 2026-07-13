import { mapSubscriptionsToPlans } from "@/features/iap/plan-mapping";

const monthly = { id: "pro_monthly", displayPrice: "$4.99", price: 4.99 };
const yearly = { id: "pro_yearly", displayPrice: "$19.99", price: 19.99 };

describe("mapSubscriptionsToPlans", () => {
  it("returns monthly first, then yearly, regardless of input order", () => {
    const plans = mapSubscriptionsToPlans([yearly, monthly]);
    expect(plans.map(p => p.sku)).toEqual(["pro_monthly", "pro_yearly"]);
    expect(plans.map(p => p.period)).toEqual(["monthly", "yearly"]);
  });

  it("keeps the store's localized displayPrice", () => {
    const plans = mapSubscriptionsToPlans([monthly, yearly]);
    expect(plans[0].displayPrice).toBe("$4.99");
    expect(plans[1].displayPrice).toBe("$19.99");
  });

  it("computes yearly savings vs 12x monthly (rounded)", () => {
    const plans = mapSubscriptionsToPlans([monthly, yearly]);
    // 1 - 19.99 / (4.99 * 12) = 0.666… → 67
    expect(plans[1].savingsPercent).toBe(67);
    expect(plans[0].savingsPercent).toBeNull();
  });

  it("returns null savings when a numeric price is missing", () => {
    const plans = mapSubscriptionsToPlans([
      { id: "pro_monthly", displayPrice: "$4.99", price: null },
      yearly,
    ]);
    expect(plans[1].savingsPercent).toBeNull();
  });

  it("ignores unknown SKUs and tolerates missing products", () => {
    const plans = mapSubscriptionsToPlans([
      { id: "other_sku", displayPrice: "$1.00", price: 1 },
      monthly,
    ]);
    expect(plans.map(p => p.sku)).toEqual(["pro_monthly"]);
  });
});

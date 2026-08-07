import { mapSubscriptionsToPlans } from "@/features/iap/plan-mapping";

const yearly = { id: "pro_yearly", displayPrice: "$4.99", price: 4.99 };

describe("mapSubscriptionsToPlans", () => {
  it("maps yearly subscription plan", () => {
    const plans = mapSubscriptionsToPlans([yearly]);
    expect(plans.map(p => p.sku)).toEqual(["pro_yearly"]);
    expect(plans.map(p => p.period)).toEqual(["yearly"]);
  });

  it("keeps the store's localized displayPrice", () => {
    const plans = mapSubscriptionsToPlans([yearly]);
    expect(plans[0].displayPrice).toBe("$4.99");
  });

  it("ignores unknown SKUs", () => {
    const plans = mapSubscriptionsToPlans([
      { id: "other_sku", displayPrice: "$1.00", price: 1 },
      yearly,
    ]);
    expect(plans.map(p => p.sku)).toEqual(["pro_yearly"]);
  });
});

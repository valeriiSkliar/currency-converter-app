import { PRO_SKU_MONTHLY, PRO_SKU_YEARLY } from "@/features/iap/products";

export type StoreSubscription = {
  id: string;
  displayPrice: string;
  price?: number | null;
};

export type ProPlan = {
  sku: string;
  period: "monthly" | "yearly";
  displayPrice: string;
  savingsPercent: number | null;
};

function yearlySavingsPercent(
  monthly: StoreSubscription | undefined,
  yearly: StoreSubscription,
): number | null {
  if (!monthly || typeof monthly.price !== "number" || typeof yearly.price !== "number") {
    return null;
  }
  const fullYear = monthly.price * 12;
  if (fullYear <= 0 || yearly.price >= fullYear) {
    return null;
  }
  return Math.round((1 - yearly.price / fullYear) * 100);
}

export function mapSubscriptionsToPlans(subs: StoreSubscription[]): ProPlan[] {
  const monthly = subs.find(s => s.id === PRO_SKU_MONTHLY);
  const yearly = subs.find(s => s.id === PRO_SKU_YEARLY);

  const plans: ProPlan[] = [];
  if (monthly) {
    plans.push({
      sku: monthly.id,
      period: "monthly",
      displayPrice: monthly.displayPrice,
      savingsPercent: null,
    });
  }
  if (yearly) {
    plans.push({
      sku: yearly.id,
      period: "yearly",
      displayPrice: yearly.displayPrice,
      savingsPercent: yearlySavingsPercent(monthly, yearly),
    });
  }
  return plans;
}

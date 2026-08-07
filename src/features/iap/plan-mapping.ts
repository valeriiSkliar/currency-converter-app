import { PRO_SKU_YEARLY } from "@/features/iap/products";

export type StoreSubscription = {
  id: string;
  displayPrice: string;
  price?: number | null;
};

export type ProPlan = {
  sku: string;
  period: "yearly";
  displayPrice: string;
};

export function mapSubscriptionsToPlans(subs: StoreSubscription[]): ProPlan[] {
  const yearly = subs.find(s => s.id === PRO_SKU_YEARLY);

  const plans: ProPlan[] = [];
  if (yearly) {
    plans.push({
      sku: yearly.id,
      period: "yearly",
      displayPrice: yearly.displayPrice,
    });
  }
  return plans;
}

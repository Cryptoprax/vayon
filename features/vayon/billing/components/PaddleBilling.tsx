import { Button } from "@/features/platform/design-system";
import {
  createPaddleCheckoutAction,
  openPaddlePortalAction,
} from "../actions/paddle.actions";
import type { PlanRecord, SubscriptionRecord } from "../types";
import { PlanCard } from "./BillingUI";

export function PaddlePlanGrid({
  plans,
  subscription,
}: {
  plans: PlanRecord[];
  subscription: SubscriptionRecord | null;
}) {
  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-3">
      {plans.map((plan) =>
        subscription ? (
          <PlanCard key={plan.id} plan={plan} subscription={subscription} />
        ) : (
          <article
            key={plan.id}
            className="rounded-3xl border border-vds-border bg-vds-surface p-5"
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-vds-muted">{plan.description}</p>
            <p className="mt-5 text-3xl font-semibold">
              {plan.monthlyPrice === null
                ? "Contact sales"
                : `${new Intl.NumberFormat("en-US", { style: "currency", currency: plan.currency, maximumFractionDigits: 0 }).format(plan.monthlyPrice)}/month`}
            </p>
            {plan.monthlyPrice !== null && plan.code !== "enterprise" ? (
              <form action={createPaddleCheckoutAction} className="mt-6">
                <input type="hidden" name="planCode" value={plan.code} />
                <input type="hidden" name="billingPeriod" value="monthly" />
                <input type="hidden" name="seatQuantity" value="1" />
                <Button variant="primary" className="w-full">
                  Create Paddle Checkout
                </Button>
              </form>
            ) : null}
          </article>
        ),
      )}
    </div>
  );
}

export function PaddlePortalButton() {
  return (
    <form action={openPaddlePortalAction}>
      <Button variant="control">Manage Subscription</Button>
    </form>
  );
}

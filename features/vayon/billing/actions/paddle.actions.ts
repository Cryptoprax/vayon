"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PaddleCheckoutService } from "../services/paddle-checkout.service";
import { PaddleCustomerService } from "../services/paddle-customer.service";
import { isPaddlePlanCode } from "../providers/paddle/paddle-catalog";

async function origin() {
  const values = await headers();
  return values.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createPaddleCheckoutAction(form: FormData) {
  const plan = String(form.get("planCode") ?? "");
  const period = String(form.get("billingPeriod") ?? "monthly");
  const seats = Number(form.get("seatQuantity") ?? 1);
  if (!isPaddlePlanCode(plan) || (period !== "monthly" && period !== "annual"))
    throw new Error("Invalid Paddle checkout selection.");
  const checkout = await new PaddleCheckoutService().create(
    plan,
    period,
    seats,
    await origin(),
  );
  redirect(checkout.url);
}

export async function openPaddlePortalAction() {
  const url = await origin();
  const portal = await new PaddleCustomerService().portal(
    `${url}/vayon/settings/billing`,
  );
  redirect(portal.url);
}

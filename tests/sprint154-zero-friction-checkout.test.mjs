import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(
  "features/vayon/billing/services/paddle-customer.service.ts",
  "utf8",
);

const resolveBillingEmail = (contact, organization, user) =>
  contact?.billing_email ?? organization?.business_email ?? user?.email;

test("billing contact email has first priority", () => {
  assert.equal(
    resolveBillingEmail(
      { billing_email: "billing@example.com" },
      { business_email: "organization@example.com" },
      { email: "user@example.com" },
    ),
    "billing@example.com",
  );
  assert.match(
    service,
    /contact\?\.billing_email\s*\?\?\s*organization\?\.business_email/,
  );
});

test("organization email is used when billing contact email is absent", () => {
  assert.equal(
    resolveBillingEmail(
      null,
      { business_email: "organization@example.com" },
      { email: "user@example.com" },
    ),
    "organization@example.com",
  );
});

test("authenticated user email is the final fallback", () => {
  assert.equal(
    resolveBillingEmail(null, null, { email: "user@example.com" }),
    "user@example.com",
  );
  assert.match(service, /context\.client\.auth\.getUser\(\)/);
  assert.match(service, /organization\?\.business_email\s*\?\?\s*session\.user\?\.email/);
});

test("missing email raises the structured billing email requirement", () => {
  assert.equal(resolveBillingEmail(null, null, null), undefined);
  assert.match(service, /code: "BILLING_EMAIL_REQUIRED"/);
  assert.match(service, /A billing email is required before checkout\./);
});

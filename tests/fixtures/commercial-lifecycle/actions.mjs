export async function manageSubscription(form) { window.billingSubmissions ??= []; window.billingSubmissions.push(Object.fromEntries(form)); return { ok: true, message: 'Request received.', ...(form.get('intent') === 'payment' ? { transactionId: 'txn_payment_qa' } : {}) }; }
export async function refreshSubscriptionState() { return { status: 'active', version: 2, plan: 'starter' }; }
export async function changePlanAction() {}
export async function cancelSubscriptionAction() {}
export async function reactivateSubscriptionAction() {}
export async function updateBillingContactAction() {}

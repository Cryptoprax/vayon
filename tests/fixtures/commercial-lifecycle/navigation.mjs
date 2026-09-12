export function useRouter() { return { refresh() { window.billingRefreshes = (window.billingRefreshes ?? 0) + 1; } }; }

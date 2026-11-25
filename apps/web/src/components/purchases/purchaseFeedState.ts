import type { PurchaseEvent, PurchaseFeedPage } from "@t3tools/contracts";

export function mergePurchasePage(
  history: readonly PurchaseEvent[],
  page: PurchaseFeedPage,
  baseline: boolean,
  now: number,
) {
  const known = new Set(history.map((event) => event.id));
  const incoming = page.events.filter((event) => {
    if (known.has(event.id)) return false;
    known.add(event.id);
    return true;
  });
  return {
    history: [...history, ...incoming].slice(-30),
    alerts: baseline
      ? []
      : incoming
          .filter((event) => {
            const age = now - Date.parse(event.purchasedAt);
            return Number.isFinite(age) && age >= -60_000 && age < 120_000;
          })
          .slice(-3),
  };
}

export function purchaseIconUrl(value: string | null): string | null {
  if (value === null || !URL.canParse(value)) return null;
  const url = new URL(value);
  return url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    (url.hostname === "rbxcdn.com" || url.hostname.endsWith(".rbxcdn.com"))
    ? url.href
    : null;
}

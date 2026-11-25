import { expect, it } from "vite-plus/test";
import type { PurchaseEvent } from "@t3tools/contracts";
import { mergePurchasePage, purchaseIconUrl } from "./purchaseFeedState";

const now = Date.parse("2026-11-25T17:00:00Z");
const event = (id: string, purchasedAt = "2026-11-25T16:59:30Z"): PurchaseEvent => ({
  id,
  gameName: "Animal Ragdoll",
  itemName: "Spider",
  robux: null,
  iconUrl: null,
  purchasedAt,
});

it("loads history silently and deduplicates overlapping pages without replaying old sales", () => {
  const first = mergePurchasePage(
    [],
    { events: [event("1")], nextCursor: "a", hasMore: false },
    true,
    now,
  );
  expect(first.alerts).toEqual([]);
  const next = mergePurchasePage(
    first.history,
    {
      events: [event("1"), event("2"), event("2"), event("3", "2026-11-24T00:00:00Z")],
      nextCursor: "b",
      hasMore: false,
    },
    false,
    now,
  );
  expect(next.history.map((sale) => sale.id)).toEqual(["1", "2", "3"]);
  expect(next.alerts.map((sale) => sale.id)).toEqual(["2"]);
  expect(next.alerts[0]?.robux).toBeNull();
});

it("bounds burst history and alerts and refuses untrusted image origins", () => {
  const merged = mergePurchasePage(
    [],
    {
      events: Array.from({ length: 50 }, (_, index) => event(String(index))),
      nextCursor: "c",
      hasMore: false,
    },
    false,
    now,
  );
  expect(merged.history).toHaveLength(30);
  expect(merged.alerts.map((sale) => sale.id)).toEqual(["47", "48", "49"]);
  expect(purchaseIconUrl("https://tr.rbxcdn.com/icon.png")).toBe("https://tr.rbxcdn.com/icon.png");
  for (const url of [
    null,
    "data:image/svg+xml,test",
    "http://tr.rbxcdn.com/icon.png",
    "https://rbxcdn.com.evil.test/icon",
    "https://secret@tr.rbxcdn.com/icon",
  ])
    expect(purchaseIconUrl(url)).toBeNull();
});

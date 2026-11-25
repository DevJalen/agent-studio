import * as Schema from "effect/Schema";

export const PurchaseEvent = Schema.Struct({
  id: Schema.String,
  gameName: Schema.String,
  itemName: Schema.String,
  robux: Schema.NullOr(Schema.Number),
  priceSource: Schema.optional(Schema.Literals(["paid", "listed", "unknown"])),
  iconUrl: Schema.NullOr(Schema.String),
  purchasedAt: Schema.String,
});
export type PurchaseEvent = typeof PurchaseEvent.Type;

export const PurchaseFeedPage = Schema.Struct({
  events: Schema.Array(PurchaseEvent),
  nextCursor: Schema.String,
  hasMore: Schema.Boolean,
});
export type PurchaseFeedPage = typeof PurchaseFeedPage.Type;

export const PurchaseFeedSnapshot = Schema.Struct({
  status: Schema.Literals(["connected", "unconfigured", "unavailable"]),
  page: Schema.NullOr(PurchaseFeedPage),
});
export type PurchaseFeedSnapshot = typeof PurchaseFeedSnapshot.Type;

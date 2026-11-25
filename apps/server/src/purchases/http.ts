import { AuthOrchestrationReadScope, EnvironmentHttpApi } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import * as HttpEffect from "effect/http/HttpEffect";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import { annotateEnvironmentRequest, requireEnvironmentScope } from "../auth/http.ts";
import * as PurchaseFeed from "./PurchaseFeed.ts";

export const layer = HttpApiBuilder.group(
  EnvironmentHttpApi,
  "purchases",
  Effect.fnUntraced(function* (handlers) {
    const feed = yield* PurchaseFeed.PurchaseFeed;
    return handlers.handle(
      "feed",
      Effect.fn("environment.purchases.feed")(function* (args) {
        yield* annotateEnvironmentRequest(args.endpoint.name);
        yield* requireEnvironmentScope(AuthOrchestrationReadScope);
        yield* HttpEffect.appendPreResponseHandler((_request, response) =>
          Effect.succeed(
            HttpServerResponse.setHeader(response, "cache-control", "private, no-store"),
          ),
        );
        return yield* feed.read(args.query.after);
      }),
    );
  }),
);

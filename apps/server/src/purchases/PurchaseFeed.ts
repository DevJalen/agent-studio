import { PurchaseFeedPage, type PurchaseFeedSnapshot } from "@t3tools/contracts";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientRequest from "effect/http/HttpClientRequest";
import * as ServerConfig from "../config.ts";

const FeedConfig = Schema.Struct({ url: Schema.String, token: Schema.String });

export class PurchaseFeed extends Context.Service<
  PurchaseFeed,
  { readonly read: (after?: string) => Effect.Effect<PurchaseFeedSnapshot> }
>()("t3/purchases/PurchaseFeed") {}

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* ServerConfig.ServerConfig;
  const http = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
  const configPath = path.join(config.secretsDir, "purchase-feed.json");

  const read = Effect.fn("PurchaseFeed.read")(
    function* (after?: string) {
      if (after !== undefined && after.length > 4096) {
        return { status: "unavailable", page: null } as const;
      }
      if (!(yield* fs.exists(configPath))) {
        return { status: "unconfigured", page: null } as const;
      }
      const settings = yield* fs
        .readFileString(configPath)
        .pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(FeedConfig))));
      if (!URL.canParse(settings.url)) return { status: "unavailable", page: null } as const;
      const url = new URL(settings.url);
      if (url.protocol !== "https:" || url.username || url.password || !settings.token) {
        return { status: "unavailable", page: null } as const;
      }
      if (after !== undefined) url.searchParams.set("after", after);
      const response = yield* http.execute(
        HttpClientRequest.get(url.toString()).pipe(
          HttpClientRequest.bearerToken(settings.token),
          HttpClientRequest.setHeader("accept", "application/json"),
        ),
      );
      const page = yield* response.json.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(PurchaseFeedPage)),
      );
      return { status: "connected", page } as const;
    },
    Effect.timeout("12 seconds"),
    Effect.orElseSucceed(() => ({ status: "unavailable", page: null }) as const),
  );

  return PurchaseFeed.of({ read });
});

export const layer = Layer.effect(PurchaseFeed, make);

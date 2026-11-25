import * as NodeServices from "@effect/platform-node/NodeServices";
import { expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as ServerConfig from "../config.ts";
import * as PurchaseFeed from "./PurchaseFeed.ts";

it.effect(
  "keeps credentials server-side and fails closed on bad configuration or upstream data",
  () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const config = yield* ServerConfig.ServerConfig;
      let calls = 0;
      let responseBody: unknown = { events: [], nextCursor: "next", hasMore: false };
      const client = HttpClient.make((request) =>
        Effect.sync(() => {
          calls++;
          expect(request.url).toBe("https://tracker.example.test/v1/feed?after=cursor%2Bvalue");
          expect(request.headers.authorization).toBe("Bearer test-only-secret");
          return HttpClientResponse.fromWeb(request, Response.json(responseBody));
        }),
      );
      const feed = yield* PurchaseFeed.PurchaseFeed.pipe(
        Effect.provide(
          PurchaseFeed.layer.pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient, client))),
        ),
      );
      expect(yield* feed.read()).toEqual({ status: "unconfigured", page: null });
      yield* fs.makeDirectory(config.secretsDir, { recursive: true });
      const file = path.join(config.secretsDir, "purchase-feed.json");
      for (const url of [
        "invalid",
        "http://tracker.example.test/v1/feed",
        "https://user:password@tracker.example.test/v1/feed",
      ]) {
        yield* fs.writeFileString(file, JSON.stringify({ url, token: "test-only-secret" }));
        expect(yield* feed.read()).toEqual({ status: "unavailable", page: null });
      }
      expect(calls).toBe(0);
      yield* fs.writeFileString(
        file,
        JSON.stringify({ url: "https://tracker.example.test/v1/feed", token: "test-only-secret" }),
      );
      const result = yield* feed.read("cursor+value");
      expect(result).toEqual({ status: "connected", page: responseBody });
      expect(JSON.stringify(result)).not.toContain("secret");
      responseBody = { events: "invalid" };
      expect(yield* feed.read("cursor+value")).toEqual({ status: "unavailable", page: null });
    }).pipe(
      Effect.provide(
        ServerConfig.layerTest(process.cwd(), { prefix: "purchase-feed-" }).pipe(
          Layer.provideMerge(NodeServices.layer),
        ),
      ),
    ),
);

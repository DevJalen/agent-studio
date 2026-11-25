import { expect, it } from "vite-plus/test";
import { modelCharacterArt } from "./modelCompanionArt";

it("gives each available model a distinct full-body ASCII character, including model versions", () => {
  const models = [
    "claude-opus-5-5",
    "claude-sonnet-5-5",
    "claude-fable-5-2",
    "claude-haiku-5-5",
    "gpt-6.2-sol",
    "gpt-6.2-astra",
    "gpt-6.1-terra",
    "gpt-6.1-sol",
    "gpt-6-astra",
    "gpt-6-luna",
  ];
  const art = models.map((model) => modelCharacterArt(model, model, "idle", 0));
  expect(new Set(art).size).toBe(models.length);
  for (const character of art) {
    expect(character.split("\n").length).toBeGreaterThan(10);
    expect(character).toMatch(/^[\x20-\x7e\n]+$/);
    expect(character).not.toMatch(/\{(?:e|tag|l|r|#)\}/);
  }
});

it("uses catalog names for opaque model ids and changes expression without moving the layout", () => {
  const normal = modelCharacterArt("gpt-6.2", "GPT-6.2-Sol", "working", 0);
  const working = modelCharacterArt("gpt-6.2", "GPT-6.2-Sol", "working", 1);
  const waiting = modelCharacterArt("gpt-6.2", "GPT-6.2-Sol", "approval", 0);
  expect(normal).not.toBe(working);
  expect(normal.split("\n").map((line) => line.length)).toEqual(
    working.split("\n").map((line) => line.length),
  );
  expect(waiting).toContain("?");
  expect(modelCharacterArt("unknown-model", "Custom model", "idle", 0)).toContain("[=]");
});

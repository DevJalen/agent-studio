import { expect, it } from "vite-plus/test";
import { modelCharacterPortrait } from "./modelCompanionArt";

it("resolves model families from catalog names and preserves version identity", () => {
  expect(modelCharacterPortrait("gpt-6.2", "GPT-6.2-Sol")).toMatchObject({
    family: "sol",
    tag: "6.2",
  });
  expect(modelCharacterPortrait("claude-fable-5-2", "Claude Fable")).toMatchObject({
    family: "fable",
    tag: "5.2",
  });
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
  const portraits = models.map((model) => JSON.stringify(modelCharacterPortrait(model, model)));
  expect(new Set(portraits).size).toBe(models.length);
  expect(modelCharacterPortrait("unknown", "Custom model").family).toBe("robot");
});

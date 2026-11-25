import * as Schema from "effect/Schema";
import { useGT } from "gt-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import type { ProviderInstanceEntry } from "../../providerInstances";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { modelCharacterArt } from "./modelCompanionArt";

const FaceMode = Schema.Literals(["animated", "still", "off"]);
type FaceMode = typeof FaceMode.Type;
const FACE_MODE_KEY = "agent-studio:model-faces";

export type CompanionState = "working" | "approval" | "input" | "error" | "idle";

function modelFace(model: string, driver: string, state: CompanionState): string {
  const square = driver === "codex";
  const eyes =
    state === "approval" || state === "input"
      ? "?"
      : state === "error"
        ? "!"
        : /opus|astra/i.test(model)
          ? "^"
          : /sonnet|sol/i.test(model)
            ? "o"
            : /haiku|luna/i.test(model)
              ? "*"
              : "+";
  return square ? `[${eyes}_${eyes}]` : `(${eyes}.${eyes})`;
}

export function ModelFace({
  model,
  driver,
  state = "idle",
  large = false,
  label = model,
}: {
  model: string;
  driver: string;
  state?: CompanionState;
  large?: boolean;
  label?: string;
}) {
  const [mode] = useLocalStorage<FaceMode, FaceMode>(FACE_MODE_KEY, "animated", FaceMode);
  if (mode === "off") return null;
  if (large)
    return (
      <span
        aria-hidden
        data-model-face
        data-state={state}
        className={cn(
          "grid select-none py-2 text-left font-mono text-xs leading-4",
          state === "working" && mode === "animated" && "model-companion-working",
        )}
      >
        <span className="col-start-1 row-start-1 whitespace-pre" data-companion-frame="rest">
          {modelCharacterArt(model, label, state, 0)}
        </span>
        <span
          className="col-start-1 row-start-1 whitespace-pre opacity-0"
          data-companion-frame="work"
        >
          {modelCharacterArt(model, label, state, 1)}
        </span>
      </span>
    );
  return (
    <span
      aria-hidden
      data-model-face
      data-state={state}
      className={cn(
        "inline-block select-none whitespace-pre font-mono",
        "mr-1.5 text-xs opacity-70",
      )}
    >
      {modelFace(model, driver, state)}
    </span>
  );
}

export function ModelCompanion({
  provider,
  model,
  state,
}: {
  provider: ProviderInstanceEntry;
  model: string;
  state: CompanionState;
}) {
  const gt = useGT();
  const [mode, setMode] = useLocalStorage<FaceMode, FaceMode>(FACE_MODE_KEY, "animated", FaceMode);
  const labels = { animated: gt("Animated"), still: gt("Still"), off: gt("Off") };
  const status = {
    working: gt("Working"),
    approval: gt("Waiting for approval"),
    input: gt("Waiting for your reply"),
    error: gt("Needs attention"),
    idle: gt("Ready when you are"),
  };
  const modelLabel = provider.models.find((entry) => entry.slug === model)?.name ?? model;
  return (
    <section aria-label={gt("Model companion")} className="border-t border-border/60 px-4 py-3">
      {mode !== "off" ? (
        <div className="flex flex-col items-center gap-1 pb-3 text-center">
          <div style={{ color: provider.accentColor }}>
            <ModelFace
              model={model}
              label={modelLabel}
              driver={provider.driverKind}
              state={state}
              large
            />
          </div>
          <span className="max-w-full truncate text-sm font-medium">{provider.displayName}</span>
          <span className="max-w-full truncate text-xs text-muted-foreground">{modelLabel}</span>
          <span
            className={cn(
              "text-xs",
              state === "approval" || state === "input" ? "text-warning" : "text-muted-foreground",
            )}
          >
            {status[state]}
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{gt("Model faces")}</span>
        <Select
          value={mode}
          onValueChange={(value) => {
            if (value) setMode(value);
          }}
        >
          <SelectTrigger size="sm" variant="ghost" aria-label={gt("Model faces")}>
            <SelectValue>{labels[mode]}</SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="animated">{labels.animated}</SelectItem>
            <SelectItem value="still">{labels.still}</SelectItem>
            <SelectItem value="off">{labels.off}</SelectItem>
          </SelectPopup>
        </Select>
      </div>
      <p className="mt-1 text-center text-3xs text-muted-foreground">
        {gt("Local animation. No model tokens or requests.")}
      </p>
    </section>
  );
}

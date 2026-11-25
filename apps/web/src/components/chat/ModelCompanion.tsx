import * as Schema from "effect/Schema";
import { useGT } from "gt-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { cn } from "../../lib/utils";
import { observeVisibleAnimation } from "../../lib/visibleAnimation";
import type { ProviderInstanceEntry } from "../../providerInstances";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { PixelModelAvatar } from "./PixelModelAvatar";

const FaceMode = Schema.Literals(["animated", "still", "off"]);
type FaceMode = typeof FaceMode.Type;
const FACE_MODE_KEY = "agent-studio:model-faces";

export type CompanionState = "working" | "approval" | "input" | "error" | "idle";

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
  return (
    <span
      aria-hidden
      data-model-face
      data-state={state}
      ref={
        large && state === "working" && mode === "animated" ? observeVisibleAnimation : undefined
      }
      className={cn(
        "inline-block shrink-0 select-none",
        large ? "h-48 w-52 py-2" : "mr-2 size-6 align-middle",
        large && state === "working" && mode === "animated" && "model-companion-working",
      )}
    >
      <PixelModelAvatar model={model || driver} label={label} state={state} />
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
    <section
      data-model-companion
      aria-label={gt("Model companion")}
      className="border-b border-border/60 bg-linear-to-b from-muted/40 to-transparent px-4 py-4"
    >
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
              "inline-flex items-center gap-1.5 text-xs",
              state === "approval" || state === "input" ? "text-warning" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                state === "working"
                  ? "bg-studio-jade"
                  : state === "approval" || state === "input"
                    ? "bg-warning"
                    : "bg-muted-foreground/60",
              )}
            />
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

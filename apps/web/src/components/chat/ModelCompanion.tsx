import { useGT } from "gt-react";
import { cn } from "../../lib/utils";
import { observeVisibleAnimation } from "../../lib/visibleAnimation";
import type { ProviderInstanceEntry } from "../../providerInstances";
import { PixelModelAvatar } from "./PixelModelAvatar";

export type CompanionState = "thinking" | "working" | "approval" | "input" | "error" | "idle";

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
  return (
    <span
      aria-hidden
      data-model-face
      data-state={state}
      ref={
        large && (state === "working" || state === "thinking") ? observeVisibleAnimation : undefined
      }
      className={cn(
        "inline-block shrink-0 select-none",
        large ? "h-56 w-64 max-w-full py-2" : "mr-2 size-6 align-middle",
        large && state === "working" && "model-companion-working",
        large && state === "thinking" && "model-companion-thinking",
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
  const status = {
    working: gt("Working"),
    thinking: gt("Thinking"),
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
      className="bg-linear-to-b from-primary/5 to-transparent px-4 py-5"
    >
      <div className="flex flex-col items-center gap-1 pb-3 text-center">
        <div className="w-full max-w-64" style={{ color: provider.accentColor }}>
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
              state === "working" || state === "thinking"
                ? "bg-studio-jade"
                : state === "approval" || state === "input"
                  ? "bg-warning"
                  : "bg-muted-foreground/60",
            )}
          />
          {status[state]}
        </span>
      </div>
    </section>
  );
}

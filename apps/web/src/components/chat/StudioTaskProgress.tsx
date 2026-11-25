import type { OrchestrationV2PlanArtifact } from "@t3tools/contracts";
import { useGT } from "gt-react";
import { CheckIcon, CircleDashedIcon, ListChecksIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function StudioTaskProgress({ plans }: { plans: readonly OrchestrationV2PlanArtifact[] }) {
  const gt = useGT();
  const plan = plans.findLast(
    (entry) => entry.kind === "todo_list" && entry.status !== "superseded",
  );
  if (plan?.kind !== "todo_list" || plan.steps.length === 0) return null;
  const completed = plan.steps.filter((step) => step.status === "completed").length;
  return (
    <section
      data-studio-progress
      aria-label={gt("Progress")}
      className="border-b border-border/60 px-4 py-3"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium">
        <ListChecksIcon className="size-4" />
        {gt("Progress")}
        <span className="ml-auto text-muted-foreground">
          {completed} / {plan.steps.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={gt("Progress")}
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={plan.steps.length}
        className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-studio-jade"
          style={{ width: `${(completed / plan.steps.length) * 100}%` }}
        />
      </div>
      <ul className="max-h-44 space-y-2 overflow-auto">
        {plan.steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2 text-xs leading-4">
            {step.status === "completed" ? (
              <CheckIcon className="mt-0.5 size-3 shrink-0 text-studio-jade" />
            ) : (
              <CircleDashedIcon
                className={cn(
                  "mt-0.5 size-3 shrink-0",
                  step.status === "running" ? "text-primary" : "text-muted-foreground",
                )}
              />
            )}
            <span>{step.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

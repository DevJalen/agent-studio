import type { ScopedThreadRef } from "@t3tools/contracts";
import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import { threadKey } from "@t3tools/client-runtime/state/entities";
import { useGT, useMessages } from "gt-react";
import { ChevronDownIcon, GitBranchIcon } from "lucide-react";
import { useState } from "react";
import {
  useHiddenThreadKeys,
  useQuietThreadProjection,
  useThreadRelationshipShells,
} from "../../state/entities";
import { ModelFace } from "../chat/ModelCompanion";
import { threadRelationshipStatusLabel } from "../chat/ThreadRelationshipIcon";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

function useStudioBranches(threadRef: ScopedThreadRef) {
  const gt = useGT();
  const shells = useThreadRelationshipShells(threadRef);
  const projection = useQuietThreadProjection(threadRef)?.projection;
  const hidden = useHiddenThreadKeys();
  const children = new Map(
    shells
      .filter(
        (thread) =>
          thread.id !== threadRef.threadId &&
          thread.archivedAt === null &&
          thread.deletedAt === null &&
          (thread.lineage.parentThreadId === threadRef.threadId ||
            (thread.forkedFrom?.type === "run" &&
              thread.forkedFrom.threadId === threadRef.threadId)),
      )
      .map((thread) => [
        thread.id,
        {
          id: thread.id,
          title: thread.title,
          model: thread.modelSelection.model,
          status: thread.activityRunStatus ?? thread.status,
        },
      ]),
  );
  for (const agent of projection?.subagents ?? []) {
    if (
      agent.childThreadId === null ||
      children.has(agent.childThreadId) ||
      shells.some(
        (thread) =>
          thread.id === agent.childThreadId &&
          (thread.archivedAt !== null || thread.deletedAt !== null),
      )
    )
      continue;
    children.set(agent.childThreadId, {
      id: agent.childThreadId,
      title: agent.title ?? gt("Subagent"),
      model: agent.modelSelection?.model ?? agent.model ?? "",
      status: agent.status === "pending" ? "queued" : agent.status,
    });
  }
  const rows = [...children.values()].filter(
    (child) => !hidden.has(threadKey(scopeThreadRef(threadRef.environmentId, child.id))),
  );
  return rows;
}

export function StudioLeadBadge({ threadRef }: { threadRef: ScopedThreadRef }) {
  const gt = useGT();
  const rows = useStudioBranches(threadRef);
  return rows.length > 0 ? (
    <span className="shrink-0 rounded-md border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-3xs text-warning-foreground">
      {gt("Lead")}
    </span>
  ) : null;
}

export function StudioBranchList({
  threadRef,
  onOpen,
}: {
  threadRef: ScopedThreadRef;
  onOpen: (ref: ScopedThreadRef) => void;
}) {
  const gt = useGT();
  const messages = useMessages();
  const [collapsed, setCollapsed] = useState(false);
  const rows = useStudioBranches(threadRef);
  if (rows.length === 0) return null;
  return (
    <div className="mb-2 ml-5 mr-1" data-studio-branches>
      <Button
        variant="ghost-muted"
        size="micro"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronDownIcon className={cn("size-3", collapsed && "-rotate-90")} />
        <GitBranchIcon className="size-3" />
        {gt("Branches")} <span className="tabular-nums">{rows.length}</span>
      </Button>
      {!collapsed ? (
        <ul className="ml-2 border-l border-border/80 pl-2">
          {rows.map((child) => (
            <li
              key={child.id}
              className="relative before:absolute before:-left-2 before:top-5 before:h-px before:w-2 before:bg-border"
            >
              <button
                type="button"
                onClick={() => onOpen(scopeThreadRef(threadRef.environmentId, child.id))}
                className="flex w-full cursor-pointer items-center gap-1 rounded-lg px-1.5 py-2 text-left hover:bg-sidebar-row-hover focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ModelFace model={child.model} driver="" />
                <span className="min-w-0 flex-1 line-clamp-2 text-xs leading-4 wrap-anywhere">
                  {child.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-3xs",
                    child.status === "running"
                      ? "bg-studio-jade/10 text-studio-jade"
                      : child.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {threadRelationshipStatusLabel(child.status, messages)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

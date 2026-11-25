import { AuthOrchestrationReadScope, type EnvironmentId } from "@t3tools/contracts";
import { refreshUsageLimits } from "@t3tools/client-runtime/state/usage";
import { Link } from "@tanstack/react-router";
import * as Schema from "effect/Schema";
import { useGT, useMessages } from "gt-react";
import { formatResetsIn } from "@t3tools/shared/usageLimitsCopy";
import { ChevronDownIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNowMinute } from "../../hooks/useNowMinute";
import { useClientSettings, updateClientSettings } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import type { ProviderInstanceEntry } from "../../providerInstances";
import { serverEnvironment } from "../../state/server";
import { useEnvironmentScope } from "../../state/session";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import { ProviderInstanceIcon } from "./ProviderInstanceIcon";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { ResetCredits } from "../usage/UsageLimits";

export function StudioAccountBar({
  providers,
  activeInstanceId,
  environmentId,
}: {
  providers: readonly ProviderInstanceEntry[];
  activeInstanceId: string | undefined;
  environmentId: EnvironmentId;
}) {
  const gt = useGT();
  const m = useMessages();
  const now = Date.parse(useNowMinute());
  const [expanded, setExpanded] = useLocalStorage(
    "agent-studio:accounts-expanded",
    true,
    Schema.Boolean,
  );
  const [refreshing, setRefreshing] = useState(false);
  const folders = useClientSettings((settings) => settings.boringSidebarEnabled);
  const canRefresh = useEnvironmentScope(environmentId, AuthOrchestrationReadScope);
  const refresh = useAtomCommand(serverEnvironment.refreshProviders);
  const accounts = providers.filter(
    (provider) =>
      provider.enabled &&
      (provider.driverKind !== "devReplay" || provider.instanceId === activeInstanceId),
  );
  if (accounts.length === 0) return null;

  return (
    <section
      aria-label={gt("Accounts and usage")}
      className="shrink-0 border-b border-border/60 bg-muted/15 px-3 py-2 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDownIcon className={cn("size-3.5", !expanded && "-rotate-90")} aria-hidden />
          {gt("Accounts and usage")}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="xs"
            aria-pressed={folders}
            onClick={() => void updateClientSettings({ boringSidebarEnabled: !folders })}
          >
            {gt("Project folders")}
          </Button>
          <Link to="/settings/providers" className="hover:text-foreground">
            {gt("Manage accounts")}
          </Link>
          <Link to="/usage" className="hover:text-foreground">
            {gt("Usage details")}
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={refreshing || !canRefresh}
            aria-label={gt("Refresh usage")}
            onClick={async () => {
              setRefreshing(true);
              await refreshUsageLimits(
                environmentId,
                () => refresh({ environmentId, input: {} }),
                false,
              ).catch(() => undefined);
              setRefreshing(false);
            }}
          >
            <RefreshCwIcon className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-2 flex items-start gap-3 overflow-x-auto pb-1">
          {accounts.map((provider) => {
            const limits = provider.snapshot.usageLimits;
            const active = provider.instanceId === activeInstanceId;
            const stale = limits !== undefined && now - Date.parse(limits.checkedAt) > 10 * 60_000;
            return (
              <div
                key={provider.instanceId}
                data-account-instance={provider.instanceId}
                className={cn(
                  "min-w-56 max-w-96 flex-1 rounded-xl border bg-muted/25 px-3 py-2.5",
                  active ? "border-foreground/25 bg-muted/50 shadow-sm" : "border-border/50",
                )}
              >
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ProviderInstanceIcon
                    driverKind={provider.driverKind}
                    displayName={provider.displayName}
                    accentColor={provider.accentColor}
                    acpRegistryAgentId={provider.acpRegistryAgentId}
                    acpRegistryIconUrl={provider.acpRegistryIconUrl}
                    showBadge
                    size="compact"
                  />
                  <span className="truncate">{provider.displayName}</span>
                  {active ? (
                    <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-3xs text-foreground">
                      {gt("In this chat")}
                    </span>
                  ) : null}
                </div>
                {provider.snapshot.auth.status === "unauthenticated" ? (
                  <div className="mt-1 text-xs text-warning">{gt("Sign-in needed")}</div>
                ) : null}
                {limits?.windows.length ? (
                  <div className="mt-2 space-y-1.5">
                    {limits.windows.slice(0, 1).map((window) => {
                      const expired =
                        window.resetsAt !== undefined && Date.parse(window.resetsAt) <= now;
                      return (
                        <div key={window.id}>
                          <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{window.label}</span>
                            <span className="shrink-0">
                              {gt("{percent}% used", { percent: Math.round(window.usedPercent) })}
                            </span>
                          </div>
                          {window.resetsAt ? (
                            <div className="mt-0.5 text-3xs text-muted-foreground">
                              {formatResetsIn(window, now, m)}
                            </div>
                          ) : null}
                          <div
                            role="meter"
                            aria-label={window.label}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={window.usedPercent}
                            className={cn(
                              "h-1 overflow-hidden rounded-full bg-muted",
                              (stale || expired) && "opacity-50",
                            )}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${window.usedPercent}%`,
                                backgroundColor: provider.accentColor ?? "var(--foreground)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {stale ||
                    limits.unavailable ||
                    limits.windows.some(
                      (window) => window.resetsAt && Date.parse(window.resetsAt) <= now,
                    ) ? (
                      <p className="text-xs text-warning">
                        {gt("Last reported usage · refresh to update")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{gt("Usage unavailable")}</p>
                )}
                {limits &&
                (limits.windows.length > 1 || (limits.resetCredits?.availableCount ?? 0) > 0) ? (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <Popover>
                      <PopoverTrigger render={<Button variant="ghost-muted" size="micro" />}>
                        {gt("Usage details")}
                        {(limits.resetCredits?.availableCount ?? 0) > 0 ? (
                          <span className="rounded bg-warning/15 px-1 text-warning-foreground">
                            {gt("Use reset")} · {limits.resetCredits?.availableCount}
                          </span>
                        ) : null}
                      </PopoverTrigger>
                      <PopoverPopup side="bottom" align="start">
                        <div className="w-64 space-y-3">
                          <p className="text-sm font-medium">{provider.displayName}</p>
                          {limits.windows.map((window) => (
                            <div key={window.id} className="text-xs">
                              <div className="flex justify-between gap-2">
                                <span>{window.label}</span>
                                <span>
                                  {gt("{percent}% used", {
                                    percent: Math.round(window.usedPercent),
                                  })}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {formatResetsIn(window, now, m)}
                              </div>
                            </div>
                          ))}
                          {limits.resetCredits && limits.resetCredits.availableCount > 0 ? (
                            <ResetCredits
                              environmentId={environmentId}
                              input={{ instanceId: provider.instanceId }}
                              credits={limits.resetCredits}
                              now={now}
                            />
                          ) : null}
                        </div>
                      </PopoverPopup>
                    </Popover>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

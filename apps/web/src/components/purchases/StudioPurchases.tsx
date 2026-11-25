import type { PurchaseEvent, PurchaseFeedSnapshot } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import { useGT } from "gt-react";
import { Volume2Icon, VolumeXIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PrimaryEnvironmentHttpClient } from "../../environments/primary/httpClient";
import { runPrimaryHttp } from "../../lib/runtime";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import purchaseSoundUrl from "../../assets/sounds/purchase.mp3";
import { mergePurchasePage, purchaseIconUrl } from "./purchaseFeedState";

const MUTED_KEY = "agent-studio-purchase-sound-muted";

const PurchaseContext = createContext<{
  status: PurchaseFeedSnapshot["status"];
  history: readonly PurchaseEvent[];
  alerts: readonly PurchaseEvent[];
  muted: boolean;
  toggleMuted: () => void;
  dismiss: (id: string) => void;
} | null>(null);

function PurchaseRow({ event }: { event: PurchaseEvent }) {
  const gt = useGT();
  const [failed, setFailed] = useState(false);
  const icon = purchaseIconUrl(event.iconUrl);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {icon && !failed ? (
          <img
            src={icon}
            alt=""
            className="size-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <ShoppingBagIcon className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold text-success">
          {event.robux === null
            ? gt("Pass purchased")
            : gt("{amount} Robux", { amount: event.robux.toLocaleString() })}
          {event.priceSource === "listed" ? (
            <Tooltip>
              <TooltipTrigger
                render={<span className="ml-1 text-xs font-normal text-muted-foreground" />}
              >
                {gt("listed")}
              </TooltipTrigger>
              <TooltipPopup>
                {gt(
                  "Current listed price; the tracker does not record the amount paid for passes.",
                )}
              </TooltipPopup>
            </Tooltip>
          ) : null}
          {event.robux !== null && event.priceSource === undefined ? (
            <Tooltip>
              <TooltipTrigger
                render={<span className="ml-1 text-xs font-normal text-muted-foreground" />}
              >
                {gt("reported")}
              </TooltipTrigger>
              <TooltipPopup>
                {gt("Reported price; this may be the current listed price.")}
              </TooltipPopup>
            </Tooltip>
          ) : null}
        </div>
        <div className="line-clamp-2 text-sm font-semibold text-foreground">{event.itemName}</div>
        <div className="truncate text-xs text-muted-foreground">{event.gameName}</div>
      </div>
    </div>
  );
}

export function StudioPurchasesProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<PurchaseFeedSnapshot["status"]>("unconfigured");
  const [history, setHistory] = useState<readonly PurchaseEvent[]>([]);
  const [alerts, setAlerts] = useState<readonly PurchaseEvent[]>([]);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const mutedRef = useRef(muted);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- Owns the purchase feed polling connection and timer until unmount.
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let cursor: string | undefined;
    let received: readonly PurchaseEvent[] = [];
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let delay = 15_000;
      try {
        const snapshot = await runPrimaryHttp(
          PrimaryEnvironmentHttpClient.pipe(
            Effect.flatMap((client) =>
              client.purchases.feed({
                headers: {},
                query: cursor === undefined ? {} : { after: cursor },
              }),
            ),
          ),
        );
        if (disposed) return;
        setStatus(snapshot.status);
        if (snapshot.page !== null) {
          const next = mergePurchasePage(received, snapshot.page, cursor === undefined, Date.now());
          received = next.history;
          cursor = snapshot.page.nextCursor;
          setHistory(received);
          if (next.alerts.length > 0) {
            setAlerts((current) => [...current, ...next.alerts].slice(-3));
            const audio = audioRef.current;
            if (!mutedRef.current && audio !== null) {
              audio.currentTime = 0;
              void audio.play().catch(() => undefined);
            }
          }
          if (snapshot.page.hasMore) delay = 250;
        } else delay = 60_000;
      } catch {
        if (disposed) return;
        setStatus("unavailable");
        delay = 60_000;
      }
      if (!disposed) timer = setTimeout(() => void poll(), delay);
    };
    void poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [enabled]);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- Owns the transient alert dismissal timer until it fires or alerts change.
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => setAlerts([]), 8_000);
    return () => clearTimeout(timer);
  }, [alerts]);

  return (
    <PurchaseContext
      value={{
        status,
        history,
        alerts,
        muted,
        dismiss: (id) => setAlerts((current) => current.filter((event) => event.id !== id)),
        toggleMuted: () => {
          const next = !muted;
          mutedRef.current = next;
          setMuted(next);
          if (next) audioRef.current?.pause();
          try {
            localStorage.setItem(MUTED_KEY, String(next));
          } catch {
            /* Storage may be disabled. */
          }
        },
      }}
    >
      {children}
      <audio ref={audioRef} src={purchaseSoundUrl} preload="auto" />
    </PurchaseContext>
  );
}

export function StudioPurchases() {
  const gt = useGT();
  const feed = useContext(PurchaseContext);
  if (feed === null || feed.status === "unconfigured") return null;
  const { status, history, alerts, muted, toggleMuted, dismiss } = feed;
  const latest = history.at(-1);
  return (
    <aside
      className="min-w-0 space-y-3 border-t border-border p-3"
      aria-label={gt("Game purchases")}
    >
      <div
        className="flex w-full flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {alerts.map((event) => (
          <div
            key={event.id}
            className="relative rounded-xl border border-success/40 bg-card p-3 pr-8 shadow-sm motion-safe:animate-purchase-in"
          >
            <div className="absolute top-1 right-1">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={gt("Dismiss purchase")}
                onClick={() => dismiss(event.id)}
              >
                <XIcon />
              </Button>
            </div>
            <div className="mb-2 text-xs font-semibold text-success">{gt("New purchase")}</div>
            <PurchaseRow event={event} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <ShoppingBagIcon className="size-4 text-muted-foreground" />
          {gt("Purchases")}
          <span
            className={
              status === "connected"
                ? "size-1.5 rounded-full bg-success"
                : "size-1.5 rounded-full bg-warning"
            }
            aria-label={status === "connected" ? gt("Live") : gt("Reconnecting…")}
          />
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={muted ? gt("Unmute purchase sounds") : gt("Mute purchase sounds")}
          aria-pressed={muted}
          onClick={toggleMuted}
        >
          {muted ? <VolumeXIcon /> : <Volume2Icon />}
        </Button>
      </div>
      {latest === undefined ? (
        <p className="text-xs text-muted-foreground">{gt("Waiting for purchases")}</p>
      ) : (
        <PurchaseRow event={latest} />
      )}
      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">
          {gt("Recent purchases")}
        </summary>
        <div className="mt-3 max-h-56 space-y-4 overflow-x-hidden overflow-y-auto">
          {history.toReversed().map((event) => (
            <div key={event.id}>
              <PurchaseRow event={event} />
              <time
                dateTime={event.purchasedAt}
                className="mt-1 block text-right text-xs text-muted-foreground"
              >
                {new Date(event.purchasedAt).toLocaleString()}
              </time>
            </div>
          ))}
        </div>
      </details>
    </aside>
  );
}

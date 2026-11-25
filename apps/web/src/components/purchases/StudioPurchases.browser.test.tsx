import type { PurchaseFeedSnapshot } from "@t3tools/contracts";
import { expect, it, vi } from "vite-plus/test";
import "~/index.css";
import { fakeTimers, render } from "../../../test/render";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../../lib/runtime", () => ({ runPrimaryHttp: mocks.read }));
import { StudioPurchases, StudioPurchasesProvider } from "./StudioPurchases";

it("automatically announces new purchases without opening history and stays inside its panel", async () => {
  mocks.read.mockReset();
  localStorage.removeItem("agent-studio-purchase-sound-muted");
  using playSound = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  using _pauseSound = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  const baseline = Promise.withResolvers<PurchaseFeedSnapshot>();
  const sale = {
    id: "1",
    gameName: "Animal Ragdoll",
    itemName: "Spider",
    robux: 129,
    priceSource: "listed" as const,
    iconUrl: null,
    purchasedAt: "2026-11-25T17:00:00Z",
  };
  mocks.read.mockReturnValueOnce(baseline.promise).mockResolvedValue({
    status: "connected",
    page: {
      events: [{ ...sale, id: "2", itemName: "Sandworm", robux: 399 }],
      nextCursor: "second",
      hasMore: false,
    },
  });
  await using screen = await render(
    <div style={{ width: 260 }}>
      <StudioPurchasesProvider enabled>
        <StudioPurchases />
      </StudioPurchasesProvider>
    </div>,
  );
  using _timers = fakeTimers();
  vi.setSystemTime(new Date("2026-11-25T17:00:00Z"));
  try {
    baseline.resolve({
      status: "connected",
      page: { events: [sale], nextCursor: "first", hasMore: false },
    });
    await expect.element(screen.getByText("Spider").first()).toBeVisible();
    await expect.element(screen.getByText("New purchase")).not.toBeInTheDocument();
    expect(playSound).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(15_000);
    await expect.element(screen.getByText("New purchase")).toBeVisible();
    expect(screen.getByRole("status").element().textContent).toContain("399 Robux");
    expect(screen.getByRole("status").element().textContent).toContain("listed");
    expect(playSound).toHaveBeenCalledTimes(1);
    const panel = screen.getByRole("complementary", { name: "Game purchases" }).element();
    expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(260);
    expect(getComputedStyle(panel).position).not.toBe("fixed");
    expect(panel.querySelector("details")?.open).toBe(false);
    await screen.getByRole("button", { name: "Mute purchase sounds" }).click();
    await expect.element(screen.getByText("New purchase")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Unmute purchase sounds" }))
      .toBeVisible();
    mocks.read.mockResolvedValue({
      status: "connected",
      page: { events: [{ ...sale, id: "3" }], nextCursor: "third", hasMore: false },
    });
    await vi.advanceTimersByTimeAsync(15_000);
    await expect.element(screen.getByText("New purchase")).toBeVisible();
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("agent-studio-purchase-sound-muted")).toBe("true");
  } finally {
    vi.clearAllTimers();
    localStorage.removeItem("agent-studio-purchase-sound-muted");
  }
});

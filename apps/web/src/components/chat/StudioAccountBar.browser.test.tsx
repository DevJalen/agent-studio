import {
  DEFAULT_CLIENT_SETTINGS,
  EnvironmentId,
  ProviderDriverKind,
  ProviderInstanceId,
  type ServerProvider,
} from "@t3tools/contracts";
import { expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import "~/index.css";
import { render } from "../../../test/render";
import { deriveProviderInstanceEntries } from "../../providerInstances";

const commands = vi.hoisted(() => ({
  refresh: vi.fn(async () => ({ _tag: "Success", value: {} })),
  redeem: vi.fn(async () => ({ _tag: "Success", value: { outcome: "reset" } })),
}));
vi.mock("../../state/server", () => ({
  serverEnvironment: { refreshProviders: "refresh", consumeResetCredit: "redeem" },
}));
vi.mock("../../state/session", () => ({
  useEnvironmentScope: () => true,
  readEnvironmentScope: () => true,
}));
vi.mock("../../state/use-atom-command", () => ({
  useAtomCommand: (command: string) => (command === "redeem" ? commands.redeem : commands.refresh),
}));
vi.mock("../../hooks/useSettings", () => ({
  useClientSettings: (select: (settings: typeof DEFAULT_CLIENT_SETTINGS) => unknown) =>
    select(DEFAULT_CLIENT_SETTINGS),
  updateClientSettings: async () => undefined,
}));

import { StudioAccountBar } from "./StudioAccountBar";

function account(id: string, percent?: number): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make(id),
    driver: ProviderDriverKind.make("claudeAgent"),
    displayName: id,
    enabled: true,
    installed: true,
    version: null,
    status: "ready",
    auth: { status: "authenticated", email: `${id}@example.com` },
    checkedAt: "2026-11-25T12:00:00.000Z",
    models: [],
    slashCommands: [],
    skills: [],
    ...(percent === undefined
      ? {}
      : {
          usageLimits: {
            checkedAt: "2020-01-01T00:00:00.000Z",
            windows: [
              { id: "session", kind: "session" as const, label: "Session", usedPercent: percent },
            ],
          },
        }),
  };
}

it("keeps each account's identity and usage separate, marks old data, and refreshes only on request", async () => {
  commands.refresh.mockClear();
  await using screen = await render(
    <StudioAccountBar
      environmentId={EnvironmentId.make("test")}
      providers={deriveProviderInstanceEntries([
        account("First", 20),
        account("Second", 85),
        account("Third"),
      ])}
      activeInstanceId="Second"
    />,
  );
  const first = screen.container.querySelector('[data-account-instance="First"]');
  const second = screen.container.querySelector('[data-account-instance="Second"]');
  const third = screen.container.querySelector('[data-account-instance="Third"]');
  expect(screen.container.textContent).not.toContain("@example.com");
  expect(first?.querySelector('[role="meter"]')?.getAttribute("aria-valuenow")).toBe("20");
  expect(second?.querySelector('[role="meter"]')?.getAttribute("aria-valuenow")).toBe("85");
  expect(second?.textContent).toContain("In this chat");
  expect(first?.textContent).toContain("Last reported usage");
  expect(third?.textContent).toContain("Usage unavailable");
  expect(third?.querySelector('[role="meter"]')).toBeNull();
  expect(commands.refresh).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Refresh usage" }).click();
  expect(commands.refresh).toHaveBeenCalledExactlyOnceWith({ environmentId: "test", input: {} });
});

it("offers the reported Fable reset and redeems only the chosen account and credit after confirmation", async () => {
  commands.redeem.mockClear();
  const second = {
    ...account("Second", 100),
    usageLimits: {
      checkedAt: "2026-11-25T12:00:00.000Z",
      windows: [],
      resetCredits: {
        availableCount: 1,
        options: [
          {
            creditId: "fable-weekly",
            label: "Fable reset",
            description: "Reset Fable usage",
            availableCount: 1,
          },
        ],
      },
    },
  } satisfies ServerProvider;
  await using screen = await render(
    <StudioAccountBar
      environmentId={EnvironmentId.make("test")}
      providers={deriveProviderInstanceEntries([account("First", 20), second])}
      activeInstanceId="Second"
    />,
  );
  await expect.element(screen.getByText("Fable reset · 1 left")).toBeVisible();
  expect(commands.redeem).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Use", exact: true }).click();
  await expect.element(page.getByRole("alertdialog")).toBeVisible();
  expect(commands.redeem).not.toHaveBeenCalled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(commands.redeem).not.toHaveBeenCalled();
  await screen.getByRole("button", { name: "Use", exact: true }).click();
  await page.getByRole("button", { name: "Use credit", exact: true }).click();
  expect(commands.redeem).toHaveBeenCalledExactlyOnceWith({
    environmentId: "test",
    input: { instanceId: "Second", creditId: "fable-weekly" },
  });
});

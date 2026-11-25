import { ProviderDriverKind, ProviderInstanceId } from "@t3tools/contracts";
import { expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import { render } from "../../../test/render";
import { deriveProviderInstanceEntries } from "../../providerInstances";
import { ModelCompanion, ModelFace } from "./ModelCompanion";
import "~/index.css";

const [provider] = deriveProviderInstanceEntries([
  {
    instanceId: ProviderInstanceId.make("claudeSecondary"),
    driver: ProviderDriverKind.make("claudeAgent"),
    displayName: "Claude · Account 2",
    enabled: true,
    installed: true,
    version: null,
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt: "2026-11-25T12:00:00.000Z",
    models: [{ slug: "claude-opus", name: "Opus", isCustom: false, capabilities: null }],
    slashCommands: [],
    skills: [],
  },
]);

function facePreferences() {
  const previous = localStorage.getItem("agent-studio:model-faces");
  localStorage.removeItem("agent-studio:model-faces");
  return {
    [Symbol.dispose]() {
      if (previous === null) localStorage.removeItem("agent-studio:model-faces");
      else localStorage.setItem("agent-studio:model-faces", previous);
    },
  };
}

it("stops the working animation when approval is needed", async () => {
  using _preferences = facePreferences();
  if (!provider) throw new Error("Missing fixture");
  await using screen = await render(
    <ModelCompanion provider={provider} model="claude-opus" state="working" />,
  );
  await expect.element(screen.getByText("Working", { exact: true })).toBeVisible();
  expect(screen.container.querySelector(".model-companion-working")).not.toBeNull();
  const pupil = screen.container.querySelector("[data-companion-pupil]");
  if (!pupil) throw new Error("Missing companion eyes");
  expect(getComputedStyle(pupil).animationName).toBe("model-companion-look");
  await screen.rerender(
    <ModelCompanion provider={provider} model="claude-opus" state="approval" />,
  );
  await expect.element(screen.getByText("Waiting for approval", { exact: true })).toBeVisible();
  expect(screen.container.querySelector(".model-companion-working")).toBeNull();
  expect(screen.container.querySelector("[data-companion-eye]")?.textContent).toBe("?");
  const head = screen.container.querySelector("[data-companion-head]");
  if (!head) throw new Error("Missing companion head");
  expect(getComputedStyle(head).animationName).toBe("none");
  await screen.rerender(<ModelCompanion provider={provider} model="claude-opus" state="idle" />);
  const idlePupil = screen.container.querySelector("[data-companion-pupil]");
  if (!idlePupil) throw new Error("Missing idle eyes");
  expect(getComputedStyle(idlePupil).animationName).toBe("none");
});

it("persists still/off choices across the companion and sidebar faces, and can restore them", async () => {
  using _preferences = facePreferences();
  if (!provider) throw new Error("Missing fixture");
  await using screen = await render(
    <>
      <ModelCompanion provider={provider} model="claude-opus" state="working" />
      <ModelFace model="gpt-sol" driver="codex" />
    </>,
  );
  await screen.getByRole("combobox", { name: "Model faces" }).click();
  await page.getByRole("option", { name: "Still", exact: true }).click();
  expect(screen.container.querySelector(".model-companion-working")).toBeNull();
  expect(screen.container.querySelectorAll("[data-model-face]")).toHaveLength(2);
  await screen.getByRole("combobox", { name: "Model faces" }).click();
  await page.getByRole("option", { name: "Off", exact: true }).click();
  expect(screen.container.querySelectorAll("[data-model-face]")).toHaveLength(0);
  expect(localStorage.getItem("agent-studio:model-faces")).toBe('"off"');
  await screen.getByRole("combobox", { name: "Model faces" }).click();
  await page.getByRole("option", { name: "Animated", exact: true }).click();
  expect(screen.container.querySelectorAll("[data-model-face]")).toHaveLength(2);
  expect(screen.container.querySelectorAll(".model-companion-working")).toHaveLength(1);
});

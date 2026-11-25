import { EnvironmentId, ThreadId } from "@t3tools/contracts";
import { expect, it, vi } from "vite-plus/test";
import { render } from "../../../test/render";
import { StudioBranchList } from "./StudioBranchList";
import "~/index.css";

vi.mock("../../state/entities", () => ({
  useHiddenThreadKeys: () => new Set(["local\u0000hidden-child"]),
  useThreadRelationshipShells: () => [
    {
      id: "child",
      title: "Movement fixes",
      archivedAt: null,
      deletedAt: null,
      lineage: { parentThreadId: "lead" },
      forkedFrom: null,
      modelSelection: { model: "claude-fable" },
      activityRunStatus: "running",
      status: "running",
    },
    {
      id: "unrelated",
      title: "Unrelated work",
      archivedAt: null,
      deletedAt: null,
      lineage: { parentThreadId: null },
      forkedFrom: null,
      modelSelection: { model: "gpt-sol" },
      activityRunStatus: null,
      status: "idle",
    },
  ],
  useQuietThreadProjection: () => ({
    projection: {
      subagents: [
        {
          childThreadId: "hidden-child",
          title: "Hidden task",
          model: "gpt-sol",
          status: "completed",
        },
        {
          childThreadId: "child",
          title: "Duplicate projection",
          model: "claude-fable",
          status: "running",
        },
        {
          childThreadId: "unloaded-child",
          title: "Effects review",
          model: "gpt-sol",
          status: "completed",
        },
      ],
    },
  }),
}));

it("shows linked branches once, opens the correct child, and folds the branch list", async () => {
  const onOpen = vi.fn();
  await using screen = await render(
    <StudioBranchList
      threadRef={{
        environmentId: EnvironmentId.make("local"),
        threadId: ThreadId.make("lead"),
      }}
      onOpen={onOpen}
    />,
  );
  expect(screen.container.textContent).not.toContain("Duplicate projection");
  expect(screen.container.textContent).not.toContain("Unrelated work");
  expect(screen.container.textContent).not.toContain("Hidden task");
  await screen.getByRole("button", { name: /Effects review/ }).click();
  expect(onOpen).toHaveBeenCalledExactlyOnceWith({
    environmentId: "local",
    threadId: "unloaded-child",
  });
  await screen.getByRole("button", { name: /Branches/ }).click();
  await expect
    .element(screen.getByRole("button", { name: /Movement fixes/ }))
    .not.toBeInTheDocument();
  await screen.getByRole("button", { name: /Branches/ }).click();
  await expect.element(screen.getByRole("button", { name: /Movement fixes/ })).toBeVisible();
});

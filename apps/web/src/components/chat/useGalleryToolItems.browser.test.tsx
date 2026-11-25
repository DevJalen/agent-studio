import {
  EnvironmentId,
  ThreadId,
  TurnItemId,
  type OrchestrationV2ProjectedTurnItem,
} from "@t3tools/contracts";
import * as DateTime from "effect/DateTime";
import { AsyncResult, Atom } from "effect/reactivity";
import { expect, it, vi } from "vite-plus/test";
import { render } from "../../../test/render";

const mocks = vi.hoisted(() => ({ turnItem: vi.fn() }));
vi.mock("../../state/orchestration", () => ({
  orchestrationEnvironment: { turnItem: mocks.turnItem },
}));
import { useGalleryToolItems } from "./useGalleryToolItems";
import { agentGalleryImages } from "./ChatImageShelf.logic";

function row(thread: string, toolName: string): OrchestrationV2ProjectedTurnItem {
  const threadId = ThreadId.make(thread);
  const id = TurnItemId.make(`${thread}:${toolName}`);
  return {
    position: 0,
    visibility: "local",
    sourceThreadId: threadId,
    sourceItemId: id,
    item: {
      id,
      threadId,
      type: "dynamic_tool",
      toolName,
      status: "completed",
      outputOmitted: true,
      input: {},
      runId: null,
      nodeId: null,
      providerThreadId: null,
      providerTurnId: null,
      nativeItemRef: null,
      parentItemId: null,
      ordinal: 0,
      title: null,
      startedAt: null,
      completedAt: null,
      updatedAt: DateTime.makeUnsafe("2026-11-25T17:00:00Z"),
    },
  };
}

function Probe({ rows }: { rows: OrchestrationV2ProjectedTurnItem[] }) {
  const tools = useGalleryToolItems(rows, EnvironmentId.make("gallery-test"));
  return <output>{agentGalleryImages([], tools).sources.join(",") || "Empty"}</output>;
}

it("hydrates omitted generation output without opening the tool and clears it when switching chats", async () => {
  mocks.turnItem.mockReset();
  const generated = row("icons", "image_gen.imagegen");
  mocks.turnItem.mockReturnValue(
    Atom.make(
      AsyncResult.success({
        item: {
          ...generated.item,
          outputOmitted: false,
          output: { status: "completed", savedPath: "C:/generated/icon.png" },
        },
      }),
    ),
  );
  await using screen = await render(<Probe rows={[generated, row("icons", "view_image")]} />, {
    // This tests the gallery subscription, with no navigation components.
    router: false,
  });
  await expect.element(screen.getByText("C:/generated/icon.png")).toBeVisible();
  expect(mocks.turnItem).toHaveBeenCalledTimes(1);
  expect(mocks.turnItem.mock.calls[0]?.[0].input.threadId).toBe("icons");
  await screen.rerender(<Probe rows={[row("other", "view_image")]} />);
  await expect.element(screen.getByText("Empty")).toBeVisible();
});

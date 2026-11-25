import { MessageId } from "@t3tools/contracts";
import { expect, it } from "vite-plus/test";
import type { ChatMessage } from "../../types";
import { agentGalleryImages, galleryToolPaths, isGalleryTool } from "./ChatImageShelf.logic";

it("keeps agent outputs and excludes user reference images, echoes, and unfinished markdown", () => {
  const message = (role: ChatMessage["role"], text: string, streaming = false): ChatMessage => ({
    id: MessageId.make(role + text),
    role,
    text,
    streaming,
    runId: null,
    createdAt: "",
    updatedAt: "",
  });
  const result = agentGalleryImages([
    message("user", "![reference](/reference.png)"),
    message("assistant", "![reference](/reference.png)\n![screenshot](/studio-shot.png)"),
    message("assistant", "![generated](/generated.png)"),
    message("assistant", "[Icon](<C:/generated/hoof kick.png>)\n[Notes](/notes.md)"),
    message("assistant", "![unfinished](/unfinished.png)", true),
    message("system", "![internal](/internal.png)"),
  ]);
  expect(result.sources).toEqual([
    "/studio-shot.png",
    "/generated.png",
    "C:/generated/hoof kick.png",
  ]);
});

it("collects completed generation and screenshot results, never viewed references or failed calls", () => {
  const generated = {
    type: "dynamic_tool" as const,
    status: "completed" as const,
    toolName: "image_gen.imagegen",
    output: { status: "completed", savedPath: "C:\\generated\\icon.png" },
  };
  expect(galleryToolPaths(generated)).toEqual(["C:\\generated\\icon.png"]);
  expect(isGalleryTool({ ...generated, output: undefined })).toBe(true);
  expect(
    galleryToolPaths({
      ...generated,
      toolName: "mcp__Roblox_Studio__take_screenshot",
      output: { path: "/capture.png" },
    }),
  ).toEqual(["/capture.png"]);
  expect(galleryToolPaths({ ...generated, toolName: "view_image" })).toEqual([]);
  expect(galleryToolPaths({ ...generated, status: "running" })).toEqual([]);
  expect(
    galleryToolPaths({ ...generated, output: { ...generated.output, isError: true } }),
  ).toEqual([]);
});

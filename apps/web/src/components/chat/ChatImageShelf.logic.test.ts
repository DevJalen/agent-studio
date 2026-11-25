import { MessageId } from "@t3tools/contracts";
import { expect, it } from "vite-plus/test";
import type { ChatMessage } from "../../types";
import { agentGalleryImages } from "./ChatImageShelf.logic";

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
    message("assistant", "![unfinished](/unfinished.png)", true),
    message("system", "![internal](/internal.png)"),
  ]);
  expect(result.sources).toEqual(["/studio-shot.png", "/generated.png"]);
});

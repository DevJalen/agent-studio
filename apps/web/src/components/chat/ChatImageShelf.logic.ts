import type { OrchestrationV2TurnItem } from "@t3tools/contracts";
import { turnItemOutputImages } from "@t3tools/client-runtime/work-log/item-detail";
import {
  chatMarkdownImageSources,
  decodeMarkdownLinkEscapes,
} from "@t3tools/shared/markdownPipeline";
import { extractMarkdownLinkHrefs } from "@t3tools/shared/markdownLinks";
import { mediaKindFromPath } from "@t3tools/shared/mediaPreview";
import { compactDynamicToolOutput } from "@t3tools/shared/toolOutput";
import { type ChatMessage, isImageAttachment } from "../../types";

type GalleryTool = Pick<OrchestrationV2TurnItem, "type" | "status"> & {
  readonly toolName?: string | null;
  readonly output?: unknown;
};

/** Viewing an existing file is not evidence that the agent created it. */
export function isGalleryTool(item: GalleryTool): boolean {
  return (
    item.type === "dynamic_tool" &&
    item.status === "completed" &&
    /(?:^|[._/])(?:imagegen|image_gen|generate_image|(?:[a-z]+_)*screenshot)$/.test(
      item.toolName ?? "",
    ) &&
    !compactDynamicToolOutput(item.output)?.isError
  );
}

export function galleryToolPaths(item: GalleryTool): string[] {
  if (!isGalleryTool(item)) return [];
  const output = item.output;
  if (typeof output !== "object" || output === null) return [];
  // Only result paths: input paths can be references used to create the image.
  return ["savedPath", "path", "filePath", "screenshotPath"].flatMap((key) => {
    const path = (output as Record<string, unknown>)[key];
    return typeof path === "string" && mediaKindFromPath(path) === "image" ? [path] : [];
  });
}

function messageImageSources(text: string): string[] {
  return [
    ...chatMarkdownImageSources(text),
    ...extractMarkdownLinkHrefs(text)
      .map(decodeMarkdownLinkEscapes)
      .filter((href) => mediaKindFromPath(href) === "image"),
  ];
}

function imageKey(source: string): string {
  let path = source;
  try {
    path = decodeURIComponent(source);
  } catch {
    /* Keep literal percent signs in filenames. */
  }
  path = path.replaceAll("\\", "/").replace(/^file:\/\/\//i, "");
  return /^[a-z]:\//i.test(path) ? path.toLowerCase() : path;
}

export function agentGalleryImages(
  messages: readonly ChatMessage[],
  toolItems: readonly OrchestrationV2TurnItem[] = [],
) {
  const references = new Set(
    messages
      .flatMap((message) =>
        message.role === "user"
          ? [
              ...messageImageSources(message.text),
              ...(message.attachments ?? []).flatMap((attachment) => [
                attachment.id,
                attachment.name,
              ]),
            ]
          : [],
      )
      .flatMap((source) => {
        const key = imageKey(source);
        return [key, key.split("/").at(-1) ?? key];
      }),
  );
  const isReference = (source: string) => {
    const key = imageKey(source);
    return references.has(key) || references.has(key.split("/").at(-1) ?? key);
  };
  const outputs = messages.filter((message) => message.role === "assistant" && !message.streaming);
  const attachments = Array.from(
    new Map(
      outputs.flatMap((message) =>
        (message.attachments ?? [])
          .filter(isImageAttachment)
          .filter((image) => !isReference(image.id) && !isReference(image.name))
          .map((image) => [image.id, image] as const),
      ),
    ).values(),
  ).slice(-48);
  const sources = Array.from(
    new Map(
      [
        ...outputs.flatMap((message) => messageImageSources(message.text)),
        ...toolItems.flatMap(galleryToolPaths),
      ]
        .filter((source) => !isReference(source))
        .map((source) => [imageKey(source), source]),
    ).values(),
  ).slice(-48);
  const toolImages = toolItems
    .flatMap((item) => (isGalleryTool(item) ? turnItemOutputImages(item) : []))
    .slice(-48);
  return { attachments, sources, toolImages };
}

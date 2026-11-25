import { chatMarkdownImageSources } from "@t3tools/shared/markdownPipeline";
import { type ChatMessage, isImageAttachment } from "../../types";

export function agentGalleryImages(messages: readonly ChatMessage[]) {
  const references = new Set(
    messages
      .filter((message) => message.role === "user")
      .flatMap((message) => [
        ...chatMarkdownImageSources(message.text),
        ...(message.attachments ?? []).flatMap((attachment) => [attachment.id, attachment.name]),
      ]),
  );
  const outputs = messages.filter((message) => message.role === "assistant" && !message.streaming);
  const attachments = Array.from(
    new Map(
      outputs.flatMap((message) =>
        (message.attachments ?? [])
          .filter(isImageAttachment)
          .filter((image) => !references.has(image.id) && !references.has(image.name))
          .map((image) => [image.id, image] as const),
      ),
    ).values(),
  ).slice(-48);
  const sources = Array.from(
    new Set(outputs.flatMap((message) => chatMarkdownImageSources(message.text))),
  )
    .filter(
      (source) =>
        !references.has(source) &&
        !references.has(source.replaceAll("\\", "/").split("/").at(-1) ?? source),
    )
    .slice(-48);
  return { attachments, sources };
}

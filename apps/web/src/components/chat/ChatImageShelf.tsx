import type { ScopedThreadRef } from "@t3tools/contracts";
import { chatMarkdownImageSources } from "@t3tools/shared/markdownPipeline";
import { useGT } from "gt-react";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { useAssetUrls } from "../../assets/assetUrls";
import { type ChatMessage, isImageAttachment } from "../../types";
import ChatMarkdown from "../ChatMarkdown";
import { AttachmentImage } from "../media/AttachmentImage";
import { Button } from "../ui/button";
import { markdownImageCopy } from "./ChatMarkdownMedia";
import type { ExpandedImagePreview } from "./ExpandedImagePreview";

interface ImageShelfProps {
  messages: readonly ChatMessage[];
  threadRef: ScopedThreadRef;
  cwd: string | undefined;
  onImageExpand: (preview: ExpandedImagePreview) => void;
}

function ImageShelfContents({ messages, threadRef, cwd, onImageExpand }: ImageShelfProps) {
  const gt = useGT();
  const attachments = Array.from(
    new Map(
      messages.flatMap((message) =>
        (message.attachments ?? [])
          .filter(isImageAttachment)
          .map((image) => [image.id, image] as const),
      ),
    ).values(),
  ).slice(-48);
  const sources = Array.from(
    new Set(
      messages
        .filter((message) => !message.streaming)
        .flatMap((message) => chatMarkdownImageSources(message.text)),
    ),
  ).slice(-48);
  const urls = useAssetUrls(
    threadRef.environmentId,
    attachments.map((image) => ({
      _tag: "attachment" as const,
      attachmentId: image.id,
      fileName: image.name,
      mimeType: image.mimeType,
    })),
  );
  const gallery = attachments.map((image, index) => ({
    src: urls[index] ?? null,
    name: image.name,
  }));
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto px-3 pb-3" data-image-gallery>
      <div className="grid grid-cols-2 gap-2">
        {attachments.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className="aspect-square overflow-hidden rounded-lg border border-border cursor-zoom-in"
            aria-label={gt("Preview {name}", { name: image.name })}
            disabled={!urls[index]}
            onClick={() => onImageExpand({ images: gallery, index })}
          >
            {urls[index] ? (
              <AttachmentImage
                src={urls[index]}
                name={image.name}
                mimeType={image.mimeType}
                alt={image.name}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground">{image.name}</span>
            )}
          </button>
        ))}
      </div>
      {sources.length > 0 ? (
        <ChatMarkdown
          text={sources.map((source) => markdownImageCopy("", source, undefined)).join("\n\n")}
          cwd={cwd}
          threadRef={threadRef}
          onImageExpand={onImageExpand}
        />
      ) : null}
    </div>
  );
}

export function ChatImageShelf(props: ImageShelfProps) {
  const gt = useGT();
  const [open, setOpen] = useState(true);
  const count = new Set(
    props.messages.flatMap((message) => [
      ...(message.attachments ?? []).filter(isImageAttachment).map((image) => image.id),
      ...(!message.streaming ? chatMarkdownImageSources(message.text) : []),
    ]),
  ).size;
  if (count === 0) return null;
  return (
    <section data-image-shelf className="border-t border-border/60">
      <div className="p-2">
        <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ImageIcon className="size-4" aria-hidden />
          {gt("Chat images")} <span className="text-muted-foreground tabular-nums">{count}</span>
        </Button>
      </div>
      {open ? <ImageShelfContents {...props} /> : null}
    </section>
  );
}

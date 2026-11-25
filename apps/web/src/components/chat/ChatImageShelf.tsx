import type { OrchestrationV2ProjectedTurnItem, ScopedThreadRef } from "@t3tools/contracts";
import { useGT } from "gt-react";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { useAssetUrls } from "../../assets/assetUrls";
import { type ChatMessage } from "../../types";
import { agentGalleryImages } from "./ChatImageShelf.logic";
import ChatMarkdown from "../ChatMarkdown";
import { AttachmentImage } from "../media/AttachmentImage";
import { Button } from "../ui/button";
import { ChatMarkdownAssetImage, markdownImageCopy } from "./ChatMarkdownMedia";
import type { ExpandedImagePreview } from "./ExpandedImagePreview";
import { useGalleryToolItems } from "./useGalleryToolItems";

interface ImageShelfProps {
  messages: readonly ChatMessage[];
  turnItems: readonly OrchestrationV2ProjectedTurnItem[];
  threadRef: ScopedThreadRef;
  cwd: string | undefined;
  onImageExpand: (preview: ExpandedImagePreview) => void;
}

function ImageShelfContents({
  images,
  threadRef,
  cwd,
  onImageExpand,
}: ImageShelfProps & {
  images: ReturnType<typeof agentGalleryImages>;
}) {
  const gt = useGT();
  const { attachments, sources, toolImages } = images;
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
        {sources.map((source) => (
          <div
            key={source}
            className="min-w-0 overflow-hidden rounded-lg [&_img]:max-h-32 [&_img]:object-contain"
          >
            <ChatMarkdown
              text={markdownImageCopy("", source, undefined)}
              cwd={cwd}
              threadRef={threadRef}
              onImageExpand={onImageExpand}
            />
          </div>
        ))}
        {toolImages.map((resource) => (
          <ChatMarkdownAssetImage
            key={`${resource.threadId}:${resource.itemId}:${resource.index}`}
            environmentId={threadRef.environmentId}
            resource={resource}
            alt={gt("Tool output image")}
            maxHeightRem={8}
            onImageExpand={onImageExpand}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatImageShelf(props: ImageShelfProps) {
  const gt = useGT();
  const [open, setOpen] = useState(true);
  const toolItems = useGalleryToolItems(props.turnItems, props.threadRef.environmentId);
  const images = agentGalleryImages(props.messages, toolItems);
  const count = images.attachments.length + images.sources.length + images.toolImages.length;
  if (count === 0) return null;
  return (
    <section data-image-shelf className="border-t border-border/60">
      <div className="p-2">
        <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ImageIcon className="size-4" aria-hidden />
          {gt("Chat images")} <span className="text-muted-foreground tabular-nums">{count}</span>
        </Button>
      </div>
      {open ? <ImageShelfContents {...props} images={images} /> : null}
    </section>
  );
}

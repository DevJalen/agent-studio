import { useAtomValue } from "@effect/atom-react";
import type {
  EnvironmentId,
  OrchestrationV2ProjectedTurnItem,
  ThreadId,
  TurnItemId,
} from "@t3tools/contracts";
import { turnItemDetailRevision } from "@t3tools/client-runtime/work-log/item-detail";
import { AsyncResult, Atom } from "effect/reactivity";
import { orchestrationEnvironment } from "../../state/orchestration";
import { isGalleryTool } from "./ChatImageShelf.logic";

const galleryDetailsAtom = Atom.family((key: string) => {
  const [environmentId, targets] = JSON.parse(key) as [
    EnvironmentId,
    Array<{
      threadId: ThreadId;
      itemId: TurnItemId;
      revision: string;
    }>,
  ];
  const queries = targets.map((input) =>
    orchestrationEnvironment.turnItem({ environmentId, input }),
  );
  return Atom.make((get) =>
    queries.flatMap((query) => {
      const result = AsyncResult.getOrElse(get(query), () => null);
      return result?.item ? [result.item] : [];
    }),
  );
});

export function useGalleryToolItems(
  rows: readonly OrchestrationV2ProjectedTurnItem[],
  environmentId: EnvironmentId,
) {
  const candidates = rows.filter((row) => isGalleryTool(row.item)).slice(-48);
  // Reuse the inspector's cached detail queries; never fetch unrelated tool output.
  const targets = candidates.flatMap((row) =>
    row.item.type === "dynamic_tool" && row.item.outputOmitted
      ? [
          {
            threadId: row.sourceThreadId,
            itemId: row.sourceItemId,
            revision: turnItemDetailRevision(row.item),
          },
        ]
      : [],
  );
  const details = useAtomValue(galleryDetailsAtom(JSON.stringify([environmentId, targets])));
  return candidates.map(
    (row) =>
      details.find(
        (item) => item.id === row.sourceItemId && item.threadId === row.sourceThreadId,
      ) ?? row.item,
  );
}

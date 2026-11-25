import { workspaceAreaProps } from "../lib/workspaceFocus";
import { T, useGT } from "gt-react";
import { MessageSquareDashedIcon, PlusIcon } from "lucide-react";

import { openCommandPalette } from "../commandPaletteBus";
import { isElectron } from "../env";
import { useScratchProject } from "../hooks/useScratchProject";
import { usePrimaryEnvironmentId } from "../state/environments";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { SidebarInset } from "./ui/sidebar";
import { WorkspacePageHeader } from "./WorkspacePageHeader";
import { Link } from "@tanstack/react-router";
import { T3Wordmark } from "./T3Wordmark";
import { APP_BASE_NAME } from "../branding";

export function NoProjectsHero() {
  const gt = useGT();
  const contentArea = workspaceAreaProps("home", 1, gt("Home"));
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const { scratchEnvironmentId, startScratchThread } = useScratchProject();
  const scratchTargetEnvironmentId = scratchEnvironmentId(primaryEnvironmentId);

  return (
    <SidebarInset
      {...contentArea}
      role="main"
      className="h-dvh min-h-0 overflow-hidden overscroll-y-none"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
        {/* The desktop window only moves where CSS opts in, so keep a titlebar strip. */}
        {isElectron ? <WorkspacePageHeader electron /> : null}
        <Empty size="hero" className="flex-1">
          <div className="w-full max-w-lg px-8 py-12">
            <EmptyHeader className="max-w-none">
              <div className="mx-auto mb-4 w-20">
                <T3Wordmark aria-hidden="true" />
              </div>
              <EmptyTitle>{APP_BASE_NAME}</EmptyTitle>
              <EmptyDescription>
                {scratchTargetEnvironmentId === null
                  ? gt("Add a project to start your first thread.")
                  : gt("Add a project, or start without one.")}
              </EmptyDescription>
              <div className="mt-6 flex justify-center gap-2">
                <Button size="sm" onClick={() => openCommandPalette({ open: "add-project" })}>
                  <PlusIcon className="size-4" />
                  <T>Add project</T>
                </Button>
                {scratchTargetEnvironmentId === null ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void startScratchThread(scratchTargetEnvironmentId)}
                  >
                    <MessageSquareDashedIcon className="size-4" />
                    <T>Start without a project</T>
                  </Button>
                )}
              </div>
              <div className="mt-5 text-sm">
                <Link
                  to="/settings/providers"
                  className="text-foreground underline underline-offset-4"
                >
                  <T>Providers</T>
                </Link>
              </div>
              <p className="mt-8 text-xs text-muted-foreground">
                <T>Unofficial fork based on T3 Code. Not affiliated with T3 Tools.</T>
              </p>
            </EmptyHeader>
          </div>
        </Empty>
      </div>
    </SidebarInset>
  );
}

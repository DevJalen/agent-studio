import type { ProviderInstanceEntry } from "../../providerInstances";
import { ProviderInstanceIcon } from "./ProviderInstanceIcon";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export function AccountIdentity({ provider }: { readonly provider: ProviderInstanceEntry }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className="inline-flex max-w-40 shrink-0 items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1 text-sm font-medium sm:max-w-56"
            data-account-instance={provider.instanceId}
          />
        }
      >
        <ProviderInstanceIcon
          driverKind={provider.driverKind}
          displayName={provider.displayName}
          accentColor={provider.accentColor}
          acpRegistryAgentId={provider.acpRegistryAgentId}
          acpRegistryIconUrl={provider.acpRegistryIconUrl}
          showBadge
          size="compact"
        />
        <span className="truncate">{provider.displayName}</span>
      </TooltipTrigger>
      <TooltipPopup>{provider.displayName}</TooltipPopup>
    </Tooltip>
  );
}

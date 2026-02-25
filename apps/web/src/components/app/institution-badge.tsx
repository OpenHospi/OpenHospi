import { getInstitution } from "@openhospi/surfconext";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  domain: string;
};

export function InstitutionBadge({ domain }: Props) {
  const institution = getInstitution(domain);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs">
            {institution.short}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{institution.name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import type { Locale } from "@openhospi/i18n";
import { getInstitution } from "@openhospi/inacademia";
import { DEFAULT_LOCALE } from "@openhospi/shared/constants";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  domain: string;
  locale?: Locale;
};

export function InstitutionBadge({ domain, locale = DEFAULT_LOCALE }: Props) {
  const institution = getInstitution(domain);
  const displayName = locale === "nl" ? institution.name.nl : institution.name.en;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs">
            {institution.short}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{displayName}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

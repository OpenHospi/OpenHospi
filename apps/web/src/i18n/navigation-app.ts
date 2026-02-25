import { createNavigation } from "next-intl/navigation";

import { appRouting } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(appRouting);

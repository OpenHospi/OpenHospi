export function isRouteActive(pathname: string, href: string): boolean {
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  if (href === "/") {
    return normalizedPathname === "" || normalizedPathname === "/";
  }

  return normalizedPathname === href || normalizedPathname.startsWith(href + "/");
}

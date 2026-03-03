"use client";

import { useEffect, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type HeaderProps = {
  fixed?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export function Header({ fixed = false, children, actions }: HeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!fixed) return;

    const container = document.querySelector("[data-layout='fixed']");
    if (!container) return;

    const handleScroll = () => {
      setHasScrolled(container.scrollTop > 10);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fixed]);

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b transition-shadow",
        fixed && "sticky top-0 z-50 bg-background/95 backdrop-blur-sm",
        hasScrolled && "shadow-sm",
      )}
    >
      <div className="flex items-center gap-1 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-2 pr-4">
        {children}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

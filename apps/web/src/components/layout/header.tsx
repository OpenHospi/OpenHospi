"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type HeaderProps = {
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

export function Header({ children, actions }: HeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollContainerRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    const container =
      document.querySelector("main") || document.querySelector("[data-slot='sidebar-inset']");

    if (!container) return;

    scrollContainerRef.current = container;

    const handleScroll = () => {
      setHasScrolled(container.scrollTop > 0);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b transition-shadow duration-200",
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm",
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

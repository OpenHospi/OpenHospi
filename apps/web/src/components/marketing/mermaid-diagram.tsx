"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  const renderDiagram = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    const { default: mermaid } = await import("mermaid");

    const isDark = document.documentElement.classList.contains("dark");

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "inherit",
    });

    const id = `mermaid-${crypto.randomUUID()}`;
    const { svg: rendered } = await mermaid.render(id, chart);
    setSvg(rendered);
  }, [chart]);

  useEffect(() => {
    renderDiagram();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          renderDiagram();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [renderDiagram]);

  // Safe: SVG is rendered by mermaid with securityLevel "strict" from our own
  // hardcoded chart definitions — no user input is involved.
  return (
    <div
      ref={containerRef}
      className={cn("overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full", className)}
      aria-label="Cryptographic protocol diagram"
      role="img"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

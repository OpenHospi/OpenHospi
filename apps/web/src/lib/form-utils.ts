import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Typed zodResolver wrapper for Zod v4 + Drizzle schema compatibility.
 * Drizzle's createInsertSchema produces types that don't perfectly match
 * @hookform/resolvers' Zod v4 overload signatures.
 */
export function zodResolver<T extends z.ZodType>(
  schema: T,
  ...args: Parameters<typeof _zodResolver> extends [unknown, ...infer R] ? R : never
): Resolver<z.infer<T>> {
  return _zodResolver(schema as Parameters<typeof _zodResolver>[0], ...args) as Resolver<
    z.infer<T>
  >;
}

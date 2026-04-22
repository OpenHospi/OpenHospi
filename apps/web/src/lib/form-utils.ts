import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

// Our validators use z.coerce.number() (HTML inputs send strings). That yields
// input=unknown, output=number — which react-hook-form's Resolver generic refuses
// to accept because it wants input-type = output-type = TFieldValues. The cast
// below pins the Resolver to the schema's output shape.
export function zodResolver<T extends z.ZodType<FieldValues>>(schema: T): Resolver<z.infer<T>> {
  return _zodResolver(schema as Parameters<typeof _zodResolver>[0]) as unknown as Resolver<
    z.infer<T>
  >;
}

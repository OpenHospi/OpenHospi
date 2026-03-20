/**
 * Creates a companion object for a string enum.
 * Each value becomes a property on the object for type-safe access.
 *
 * @internal Not re-exported to consumers — use the enum objects directly.
 */
export function defineEnum<const T extends readonly string[]>(values: T) {
  const result = { values } as { readonly values: T } & {
    readonly [K in T[number]]: K;
  };
  for (const v of values) {
    (result as Record<string, string>)[v] = v;
  }
  return result;
}

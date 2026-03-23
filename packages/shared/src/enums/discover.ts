import { defineEnum } from "./utils/define-enum";

export const DiscoverSort = defineEnum(["newest", "cheapest", "most_expensive"] as const);
export type DiscoverSort = (typeof DiscoverSort.values)[number];

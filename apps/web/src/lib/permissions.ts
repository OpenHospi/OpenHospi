import type { HouseMemberRole } from "@openhospi/shared/enums";

export type HousePermission =
  | "room:create" | "room:edit" | "room:delete" | "room:publish" | "room:close"
  | "application:review" | "application:invite" | "application:decide"
  | "house:manage" | "house:invite";

const ROLE_PERMISSIONS: Record<HouseMemberRole, readonly HousePermission[]> = {
  owner: [
    "room:create", "room:edit", "room:delete", "room:publish", "room:close",
    "application:review", "application:invite", "application:decide",
    "house:manage", "house:invite",
  ],
  member: ["application:review"],
};

export function hasPermission(role: HouseMemberRole, permission: HousePermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

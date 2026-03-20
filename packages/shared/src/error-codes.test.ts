import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  ChatError,
  CommonError,
  EventError,
  JoinError,
  OnboardingError,
  RoomError,
  SettingsError,
} from "./error-codes";

const ALL_ERROR_GROUPS: Record<string, { readonly values: readonly string[] }> = {
  CommonError,
  RoomError,
  ApplicationError,
  OnboardingError,
  SettingsError,
  JoinError,
  ChatError,
  EventError,
};

describe("@openhospi/shared — error-codes", () => {
  it("exports 8 error code groups", () => {
    expect(Object.keys(ALL_ERROR_GROUPS)).toHaveLength(8);
  });

  it.each(Object.entries(ALL_ERROR_GROUPS))("%s has a non-empty values array", (_name, group) => {
    expect(Array.isArray(group.values)).toBe(true);
    expect(group.values.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(ALL_ERROR_GROUPS))("%s values are snake_case strings", (_name, group) => {
    for (const value of group.values) {
      expect(typeof value).toBe("string");
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("all values are unique across groups", () => {
    const allValues = Object.values(ALL_ERROR_GROUPS).flatMap((g) => [...g.values]);
    const unique = new Set(allValues);
    expect(unique.size).toBe(allValues.length);
  });

  it("companion object access works", () => {
    expect(CommonError.rate_limited).toBe("rate_limited");
    expect(RoomError.invalid_name).toBe("invalid_name");
    expect(ApplicationError.bio_required).toBe("bio_required");
    expect(OnboardingError.invalid_code).toBe("invalid_code");
    expect(SettingsError.no_data).toBe("no_data");
    expect(JoinError.invalid_link).toBe("invalid_link");
    expect(ChatError.cannot_block_self).toBe("cannot_block_self");
    expect(EventError.event_cancelled).toBe("event_cancelled");
  });
});

import { describe, it, expect } from "vitest";

import {
  Gender,
  GenderPreference,
  Language,
  StudyLevel,
  LifestyleTag,
  HouseType,
  RoomStatus,
  Furnishing,
  RoomFeature,
  RentalType,
  LocationTag,
  City,
  ApplicationStatus,
  ReviewDecision,
  InvitationStatus,
  HouseMemberRole,
  ConversationType,
  MessageType,
  DeliveryStatus,
  AdminAction,
  ReportReason,
  ReportStatus,
  ReportType,
  DiscoverSort,
  Vereniging,
  ConsentPurpose,
  LegalBasis,
  DataRequestType,
  DataRequestStatus,
  UtilitiesIncluded,
} from "./enums";

const ALL_ENUMS: Record<string, { readonly values: readonly string[] }> = {
  Gender,
  GenderPreference,
  Language,
  StudyLevel,
  LifestyleTag,
  HouseType,
  RoomStatus,
  Furnishing,
  RoomFeature,
  RentalType,
  LocationTag,
  City,
  ApplicationStatus,
  ReviewDecision,
  InvitationStatus,
  HouseMemberRole,
  ConversationType,
  MessageType,
  DeliveryStatus,
  AdminAction,
  ReportReason,
  ReportStatus,
  ReportType,
  DiscoverSort,
  Vereniging,
  ConsentPurpose,
  LegalBasis,
  DataRequestType,
  DataRequestStatus,
  UtilitiesIncluded,
};

describe("@openhospi/shared — enums", () => {
  it("exports 30 enum companion objects", () => {
    expect(Object.keys(ALL_ENUMS)).toHaveLength(30);
  });

  it.each(Object.entries(ALL_ENUMS))("%s has a non-empty values array", (_name, enumObj) => {
    expect(Array.isArray(enumObj.values)).toBe(true);
    expect(enumObj.values.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(ALL_ENUMS))("%s contains only unique values", (_name, enumObj) => {
    const unique = new Set(enumObj.values);
    expect(unique.size).toBe(enumObj.values.length);
  });

  it.each(Object.entries(ALL_ENUMS))(
    "%s values are lowercase/snake_case strings",
    (_name, enumObj) => {
      for (const value of enumObj.values) {
        expect(typeof value).toBe("string");
        expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    },
  );

  it("Gender has expected values", () => {
    expect([...Gender.values]).toEqual(["male", "female", "prefer_not_to_say"]);
  });

  it("City includes major Dutch cities and has 60 values", () => {
    expect(City.values).toContain("amsterdam");
    expect(City.values).toContain("groningen");
    expect(City.values).toContain("utrecht");
    expect(City.values).toContain("dronten");
    expect(City.values).toContain("terschelling");
    expect(City.values).not.toContain("anders");
    expect(City.values).toHaveLength(60);
  });

  it("LifestyleTag has at least 20 tags", () => {
    expect(LifestyleTag.values.length).toBeGreaterThanOrEqual(20);
  });

  it('Vereniging includes "other" and has at least 150 values', () => {
    expect(Vereniging.values).toContain("other");
    expect(Vereniging.values).toContain("vindicat");
    expect(Vereniging.values).toContain("minerva");
    expect(Vereniging.values.length).toBeGreaterThanOrEqual(150);
  });

  it("companion objects provide direct property access", () => {
    expect(Gender.male).toBe("male");
    expect(RoomStatus.active).toBe("active");
    expect(ApplicationStatus.sent).toBe("sent");
  });

  it("DiscoverSort has expected values", () => {
    expect([...DiscoverSort.values]).toEqual(["newest", "cheapest", "most_expensive"]);
  });
});

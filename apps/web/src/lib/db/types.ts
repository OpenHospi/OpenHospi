import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { applications, reviews } from "./schema/applications";
import { account, session, user, verification } from "./schema/auth-schema";
import { hospiEvents, hospiInvitations, votes } from "./schema/events";
import { houseMembers, houses } from "./schema/houses";
import { adminAuditLog, notifications, pushTokens } from "./schema/notifications";
import { profilePhotos, profiles } from "./schema/profiles";
import { roomPhotos, rooms } from "./schema/rooms";
import { blocks, reports } from "./schema/security";

// Auth
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;

// Profiles
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type ProfilePhoto = InferSelectModel<typeof profilePhotos>;
export type NewProfilePhoto = InferInsertModel<typeof profilePhotos>;

// Houses
export type House = InferSelectModel<typeof houses>;
export type NewHouse = InferInsertModel<typeof houses>;
export type HouseMember = InferSelectModel<typeof houseMembers>;
export type NewHouseMember = InferInsertModel<typeof houseMembers>;

// Rooms
export type Room = InferSelectModel<typeof rooms>;
export type NewRoom = InferInsertModel<typeof rooms>;
export type RoomPhoto = InferSelectModel<typeof roomPhotos>;
export type NewRoomPhoto = InferInsertModel<typeof roomPhotos>;

// Applications
export type Application = InferSelectModel<typeof applications>;
export type NewApplication = InferInsertModel<typeof applications>;
export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;

// Events
export type HospiEvent = InferSelectModel<typeof hospiEvents>;
export type NewHospiEvent = InferInsertModel<typeof hospiEvents>;
export type HospiInvitation = InferSelectModel<typeof hospiInvitations>;
export type Vote = InferSelectModel<typeof votes>;

// Security
export type Report = InferSelectModel<typeof reports>;
export type Block = InferSelectModel<typeof blocks>;

// Notifications
export type PushToken = InferSelectModel<typeof pushTokens>;
export type Notification = InferSelectModel<typeof notifications>;
export type AdminAuditLogEntry = InferSelectModel<typeof adminAuditLog>;

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { applications, reviews } from "./schema/applications";
import { account, session, ssoProvider, user, verification } from "./schema/auth";
import { conversationMembers, conversations, messageReceipts, messages } from "./schema/chat";
import { hospiEvents, hospiInvitations, votes } from "./schema/events";
import { adminAuditLog, notifications, pushTokens } from "./schema/notifications";
import { profilePhotos, profiles } from "./schema/profiles";
import { housemates, roomPhotos, rooms } from "./schema/rooms";
import { blocks, privateKeyBackups, publicKeys, reports } from "./schema/security";

// Auth
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;
export type SsoProvider = InferSelectModel<typeof ssoProvider>;

// Profiles
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type ProfilePhoto = InferSelectModel<typeof profilePhotos>;
export type NewProfilePhoto = InferInsertModel<typeof profilePhotos>;

// Rooms
export type Room = InferSelectModel<typeof rooms>;
export type NewRoom = InferInsertModel<typeof rooms>;
export type RoomPhoto = InferSelectModel<typeof roomPhotos>;
export type NewRoomPhoto = InferInsertModel<typeof roomPhotos>;
export type Housemate = InferSelectModel<typeof housemates>;
export type NewHousemate = InferInsertModel<typeof housemates>;

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

// Chat
export type Conversation = InferSelectModel<typeof conversations>;
export type ConversationMember = InferSelectModel<typeof conversationMembers>;
export type Message = InferSelectModel<typeof messages>;
export type MessageReceipt = InferSelectModel<typeof messageReceipts>;

// Security
export type PublicKey = InferSelectModel<typeof publicKeys>;
export type PrivateKeyBackup = InferSelectModel<typeof privateKeyBackups>;
export type Report = InferSelectModel<typeof reports>;
export type Block = InferSelectModel<typeof blocks>;

// Notifications
export type PushToken = InferSelectModel<typeof pushTokens>;
export type Notification = InferSelectModel<typeof notifications>;
export type AdminAuditLogEntry = InferSelectModel<typeof adminAuditLog>;

import type admin from "../messages/nl/admin.json";
import type legal from "../messages/nl/legal.json";
import type shared from "../messages/nl/shared.json";
import type web from "../messages/nl/web.json";

// Web app gets all 4 merged message files
export type WebMessages = typeof shared & typeof web & typeof admin & typeof legal;

// Admin app gets shared + admin only
export type AdminMessages = typeof shared & typeof admin;

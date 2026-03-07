import type admin from "../messages/nl/admin.json";
import type app from "../messages/nl/app.json";
import type legal from "../messages/nl/legal.json";
import type shared from "../messages/nl/shared.json";
import type web from "../messages/nl/web.json";

// Web app gets all 4 merged message files
export type WebMessages = typeof shared & typeof web & typeof admin & typeof legal;

// Mobile app gets shared + app messages
export type AppMessages = typeof shared & typeof app;

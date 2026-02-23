// Single source of truth for UI + validation
// Every enum maps 1:1 to a SQL enum and translation key: enums.{enum_name}.{value}

export const GENDERS = ['man', 'vrouw', 'zeg_ik_liever_niet'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_PREFERENCES = ['man', 'vrouw', 'geen_voorkeur'] as const;
export type GenderPreference = (typeof GENDER_PREFERENCES)[number];

export const LANGUAGES = [
  'nl', 'en', 'de', 'fr', 'es', 'it', 'pt',
  'zh', 'ar', 'tr', 'pl', 'hi', 'ja', 'ko',
] as const;
export type Language = (typeof LANGUAGES)[number];

export const AFFILIATIONS = ['student', 'employee', 'staff'] as const;
export type Affiliation = (typeof AFFILIATIONS)[number];

export const STUDY_LEVELS = [
  'mbo', 'hbo_propedeuse', 'hbo_bachelor',
  'wo_propedeuse', 'wo_bachelor', 'pre_master', 'master', 'phd',
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

export const LIFESTYLE_TAGS = [
  // Social vibe
  'gezellig', 'rustig', 'introvert', 'extravert',
  // Activities
  'sporten', 'koken', 'gamen', 'muziek', 'uitgaan', 'feesten',
  'studeren', 'lezen', 'reizen', 'filmavond', 'creatief',
  // Living rhythm
  'vroege_vogel', 'nachtbraker',
  // Household
  'schoon', 'relaxed_met_schoonmaken',
  // Diet & lifestyle
  'vegetarisch', 'vegan', 'duurzaam',
  // Social values
  'inclusief', 'internationaal', 'huisdieren',
] as const;
export type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

export const HOUSE_TYPES = ['studentenhuis', 'appartement', 'studio', 'woongroep', 'anti_kraak'] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];

export const ROOM_STATUSES = ['draft', 'active', 'paused', 'closed'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const FURNISHINGS = ['kaal', 'gestoffeerd', 'gemeubileerd'] as const;
export type Furnishing = (typeof FURNISHINGS)[number];

export const ROOM_FEATURES = [
  'eigen_badkamer', 'gedeelde_badkamer', 'eigen_keuken', 'gedeelde_keuken',
  'balkon', 'tuin', 'terras', 'berging', 'parkeerplaats', 'fietsenstalling',
  'wasmachine', 'droger', 'vaatwasser', 'wifi_inbegrepen',
  'huisdieren_toegestaan', 'roken_toegestaan', 'geen_huisdieren', 'niet_roken',
] as const;
export type RoomFeature = (typeof ROOM_FEATURES)[number];

export const RENTAL_TYPES = ['vast', 'onderhuur', 'tijdelijk'] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];

export const LOCATION_TAGS = [
  'dichtbij_universiteit', 'dichtbij_station', 'dichtbij_ov',
  'dichtbij_centrum', 'dichtbij_supermarkt', 'dichtbij_uitgaan',
  'dichtbij_sportcentrum', 'dichtbij_park',
  'rustige_buurt', 'levendige_buurt',
] as const;
export type LocationTag = (typeof LOCATION_TAGS)[number];

export const CITIES = [
  'amsterdam', 'rotterdam', 'den_haag', 'utrecht', 'groningen',
  'eindhoven', 'tilburg', 'nijmegen', 'enschede', 'arnhem',
  'leiden', 'maastricht', 'delft', 'breda', 'leeuwarden',
  'zwolle', 'den_bosch', 'haarlem', 'wageningen', 'middelburg',
  'vlissingen', 'deventer', 'apeldoorn', 'amersfoort', 'almere',
  'dordrecht', 'heerlen', 'sittard', 'venlo', 'helmond',
  'anders',
] as const;
export type City = (typeof CITIES)[number];

export const APPLICATION_STATUSES = [
  'sent', 'seen', 'liked', 'maybe', 'rejected',
  'invited', 'attending', 'not_attending',
  'accepted', 'not_chosen', 'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const REVIEW_DECISIONS = ['like', 'maybe', 'reject'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const INVITATION_STATUSES = ['pending', 'attending', 'not_attending', 'maybe'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const HOUSEMATE_ROLES = ['owner', 'admin', 'member'] as const;
export type HousemateRole = (typeof HOUSEMATE_ROLES)[number];

export const CONVERSATION_TYPES = ['direct', 'group', 'house'] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const MESSAGE_TYPES = ['text', 'image', 'system'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const DELIVERY_STATUSES = ['sent', 'delivered', 'read'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const ADMIN_ACTIONS = [
  'view_report', 'suspend_user', 'unsuspend_user',
  'remove_listing', 'remove_message', 'dismiss_report',
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export const REPORT_REASONS = [
  'spam', 'harassment', 'fake_profile', 'inappropriate_content',
  'scam', 'discrimination', 'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

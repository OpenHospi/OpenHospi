// Single source of truth for UI + validation
// Every enum maps 1:1 to a SQL enum and translation key: enums.{enum_name}.{value}

function defineEnum<const T extends readonly string[]>(values: T) {
  const result = { values } as { readonly values: T } & {
    readonly [K in T[number]]: K;
  };
  for (const v of values) {
    (result as Record<string, string>)[v] = v;
  }
  return result;
}

// ─── Identity enums ───────────────────────────────────────────────────────

export const Gender = defineEnum([
  "male",
  "female",
  "prefer_not_to_say",
] as const);
export type Gender = (typeof Gender.values)[number];

export const GenderPreference = defineEnum([
  "male",
  "female",
  "no_preference",
] as const);
export type GenderPreference = (typeof GenderPreference.values)[number];

export const Language = defineEnum([
  "nl",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "zh",
  "ar",
  "tr",
  "pl",
  "hi",
  "ja",
  "ko",
] as const);
export type Language = (typeof Language.values)[number];

export const StudyLevel = defineEnum([
  "mbo",
  "hbo_propedeuse",
  "hbo_bachelor",
  "wo_propedeuse",
  "wo_bachelor",
  "pre_master",
  "master",
  "phd",
] as const);
export type StudyLevel = (typeof StudyLevel.values)[number];

export function getStudyLevelsForInstitutionType(
  type: string,
): readonly StudyLevel[] {
  switch (type) {
    case "MBO":
      return ["mbo"] as const;
    case "HBO":
      return [
        "hbo_propedeuse",
        "hbo_bachelor",
        "pre_master",
        "master",
      ] as const;
    case "WO":
    case "UMC":
      return [
        "wo_propedeuse",
        "wo_bachelor",
        "pre_master",
        "master",
        "phd",
      ] as const;
    default:
      return StudyLevel.values;
  }
}

// ─── Lifestyle & personality ──────────────────────────────────────────────

export const LifestyleTag = defineEnum([
  // Social vibe
  "sociable",
  "quiet",
  "introvert",
  "extrovert",
  // Activities
  "sports",
  "cooking",
  "gaming",
  "music",
  "nightlife",
  "partying",
  "studying",
  "reading",
  "traveling",
  "movie_night",
  "creative",
  // Living rhythm
  "early_bird",
  "night_owl",
  // Household
  "tidy",
  "relaxed_cleaning",
  // Diet & lifestyle
  "vegetarian",
  "vegan",
  "sustainable",
  // Social values
  "inclusive",
  "international",
  "pets",
] as const);
export type LifestyleTag = (typeof LifestyleTag.values)[number];

// ─── Housing ──────────────────────────────────────────────────────────────

export const HouseType = defineEnum([
  "student_house",
  "apartment",
  "studio",
  "living_group",
  "anti_squat",
] as const);
export type HouseType = (typeof HouseType.values)[number];

export const RoomStatus = defineEnum([
  "draft",
  "active",
  "paused",
  "closed",
] as const);
export type RoomStatus = (typeof RoomStatus.values)[number];

export const Furnishing = defineEnum([
  "unfurnished",
  "semi_furnished",
  "furnished",
] as const);
export type Furnishing = (typeof Furnishing.values)[number];

export const RoomFeature = defineEnum([
  "private_bathroom",
  "shared_bathroom",
  "private_kitchen",
  "shared_kitchen",
  "balcony",
  "garden",
  "terrace",
  "storage",
  "parking",
  "bike_storage",
  "washing_machine",
  "dryer",
  "dishwasher",
  "wifi_included",
  "pets_allowed",
  "smoking_allowed",
  "no_pets",
  "no_smoking",
] as const);
export type RoomFeature = (typeof RoomFeature.values)[number];

export const UtilitiesIncluded = defineEnum([
  "included",
  "not_included",
  "estimated",
] as const);
export type UtilitiesIncluded = (typeof UtilitiesIncluded.values)[number];

export const RentalType = defineEnum([
  "permanent",
  "sublet",
  "temporary",
] as const);
export type RentalType = (typeof RentalType.values)[number];

export const LocationTag = defineEnum([
  "near_university",
  "near_station",
  "near_transit",
  "near_center",
  "near_supermarket",
  "near_nightlife",
  "near_sports_center",
  "near_park",
  "quiet_neighborhood",
  "lively_neighborhood",
] as const);
export type LocationTag = (typeof LocationTag.values)[number];

// ─── Cities (proper nouns — stay as-is) ───────────────────────────────────

export const City = defineEnum([
  "amsterdam",
  "rotterdam",
  "den_haag",
  "utrecht",
  "groningen",
  "eindhoven",
  "tilburg",
  "nijmegen",
  "enschede",
  "arnhem",
  "leiden",
  "maastricht",
  "delft",
  "breda",
  "leeuwarden",
  "zwolle",
  "den_bosch",
  "haarlem",
  "wageningen",
  "middelburg",
  "vlissingen",
  "deventer",
  "apeldoorn",
  "amersfoort",
  "almere",
  "dordrecht",
  "heerlen",
  "sittard",
  "venlo",
  "helmond",
  "zoetermeer",
  "amstelveen",
  "alkmaar",
  "hilversum",
  "lelystad",
  "purmerend",
  "hengelo",
  "zaandam",
  "schiedam",
  "hoofddorp",
  "ede",
  "gouda",
  "hoorn",
  "vlaardingen",
  "alphen_aan_den_rijn",
  "spijkenisse",
  "almelo",
  "assen",
  "veenendaal",
  "capelle_aan_den_ijssel",
  "roosendaal",
  "nieuwegein",
  "heerhugowaard",
  "oss",
  "emmen",
  "rijswijk",
  "zeist",
  "bergen_op_zoom",
  "dronten",
  "terschelling",
] as const);
export type City = (typeof City.values)[number];

// ─── Applications & reviews ───────────────────────────────────────────────

export const ApplicationStatus = defineEnum([
  "sent",
  "seen",
  "liked",
  "maybe",
  "rejected",
  "invited",
  "attending",
  "not_attending",
  "accepted",
  "not_chosen",
  "withdrawn",
] as const);
export type ApplicationStatus = (typeof ApplicationStatus.values)[number];

export const ReviewDecision = defineEnum(["like", "maybe", "reject"] as const);
export type ReviewDecision = (typeof ReviewDecision.values)[number];

export const InvitationStatus = defineEnum([
  "pending",
  "attending",
  "not_attending",
  "maybe",
] as const);
export type InvitationStatus = (typeof InvitationStatus.values)[number];

export const HouseMemberRole = defineEnum(["owner", "member"] as const);
export type HouseMemberRole = (typeof HouseMemberRole.values)[number];

// ─── Chat ─────────────────────────────────────────────────────────────────

export const ConversationType = defineEnum(["direct", "house"] as const);
export type ConversationType = (typeof ConversationType.values)[number];

export const MessageType = defineEnum(["text", "system"] as const);
export type MessageType = (typeof MessageType.values)[number];

export const DeliveryStatus = defineEnum([
  "sent",
  "delivered",
  "read",
] as const);
export type DeliveryStatus = (typeof DeliveryStatus.values)[number];

// ─── Admin & reports ──────────────────────────────────────────────────────

export const AdminAction = defineEnum([
  "view_report",
  "update_report",
  "suspend_user",
  "unsuspend_user",
  "remove_listing",
  "remove_message",
  "dismiss_report",
] as const);
export type AdminAction = (typeof AdminAction.values)[number];

export const ReportReason = defineEnum([
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "scam",
  "discrimination",
  "other",
] as const);
export type ReportReason = (typeof ReportReason.values)[number];

export const ReportType = defineEnum(["message", "user", "room"] as const);
export type ReportType = (typeof ReportType.values)[number];

export const ReportStatus = defineEnum([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
] as const);
export type ReportStatus = (typeof ReportStatus.values)[number];

// ─── Discover ─────────────────────────────────────────────────────────────

export const DiscoverSort = defineEnum([
  "newest",
  "cheapest",
  "most_expensive",
] as const);
export type DiscoverSort = (typeof DiscoverSort.values)[number];

// ─── Verenigingen (proper nouns — stay as-is) ─────────────────────────────

export const Vereniging = defineEnum([
  // Alkmaar
  "omnivas",
  // Almere
  "endzjin_sveia",
  "sv_bazinga",
  // Amsterdam
  "asc_avsv",
  "asv_gay",
  "aegee_amsterdam",
  "sib_amsterdam",
  "sa_comitas",
  "sv_cyclades",
  "odd_selene",
  "derm",
  "lanx",
  "sv_liber",
  "svaa_nonomes",
  "particolarte",
  "ssra",
  "unitas_sa",
  // Arnhem
  "arboricultura",
  "sv_creas",
  "sv_campuscafe_lokaal_99",
  "quercus",
  "trolleystam",
  // Breda
  "sv_maximus",
  "sv_phileas_fogg",
  "sv_virgo",
  // Delft
  "aegee_delft",
  "aldgillis",
  "delftsch_studenten_corps",
  "delftsche_studenten_bond",
  "delftsche_zwervers",
  "dsv_nieuwe_delft",
  "dsv_sint_jansbrug",
  "outsite",
  "ksv_sanctus_virgilius",
  "mv_wolbodo",
  "moeder_delftsche",
  "ojv_de_koornbeurs",
  "sv_hezarfen",
  "sv_nova",
  "uknighted",
  "vsstd",
  // Deventer
  "nescio",
  "pro_deo",
  // Dronten
  "usra",
  // Eindhoven
  "aegee_eindhoven",
  "atmos",
  "br_beurs",
  "cosmos",
  "compass",
  "esv_demos",
  "estv_doppio",
  "eindhovens_studenten_corps",
  "jces_kinjin",
  "sa_salaam",
  "ssre",
  "tuna_ciudad_de_luz",
  "ledstam",
  // Enschede
  "audentis_et_virtutis",
  "asv_taste",
  "aegee_enschede",
  "csv_alpha_enschede",
  "radix",
  // Den Haag
  "hsv",
  "intac",
  "la_confrerie",
  // Groningen
  "aegee_groningen",
  "albertus_magnus",
  "ffj_bernlef",
  "cavv",
  "cleopatra",
  "asv_dizkartes",
  "flanor",
  "csg_gica",
  "ganymedes",
  "gsv_groningen",
  "csv_ichthus_groningen",
  "martinistam",
  "unitas_sg",
  "sib_groningen",
  "vindicat",
  // Haarlem
  "carpe_noctem",
  "haerlems_studenten_gildt",
  // Heerlen
  "volupia",
  "woord_en_daad",
  // Den Bosch
  "animoso",
  "gremio_unio",
  // Leeuwarden
  "io_vivat",
  "osiris",
  "asvl_sempiternus",
  "wolweze",
  "luwt_stam",
  // Leiden
  "augustinus",
  "catena",
  "minerva",
  "quintus",
  "ssr_leiden",
  "aegee_leiden",
  "dac",
  "sib_leiden",
  "het_duivelsei",
  "asv_prometheus",
  "sleutelstam",
  "gnsv_leiden",
  // Maastricht
  "amphitryon",
  "circumflex",
  "sv_koko",
  "tragos",
  // Nijmegen
  "aegee_nijmegen",
  "nsv_carolus_magnus",
  "asv_karpe_noktem",
  "noviomagustam",
  "nsba",
  "nsv_ovum_novum",
  "sv_sturad",
  "vsa_nijmegen",
  "gnsv_nijmegen",
  // Rotterdam
  "rsc_rvsv",
  "rsv_sanctus_laurentius",
  "ssr_rotterdam",
  "rsg",
  "nsr",
  "vgsr",
  // Terschelling
  "wbs",
  // Tilburg
  "tsv_plato",
  "sint_olof",
  "totus",
  // Utrecht
  "biton",
  "sib_utrecht",
  "ssr_nu",
  "uhsv_anteros",
  "umtc",
  "unitas_srt",
  "utrechtsch_studenten_corps",
  "uvsv_nvvsu",
  "veritas",
  "ufo_stam",
  "gnsv_utrecht",
  // Vlissingen
  "aqua_ad_vinum",
  "marum_bibio",
  // Wageningen
  "brabants_studenten_gilde",
  "wsv_ceres",
  "franciscus_xaverius",
  "t_noaberschop",
  "dlv_nji_sri",
  "ssr_w",
  "unitas_wageningen",
  "wsg_paragon",
  "yggdrasilstam",
  // Zaandam
  "zsv",
  // Zwolle
  "gumbo_millennium",
  "oikos_nomos",
  "zhtc",
  // Fallback
  "other",
] as const);
export type Vereniging = (typeof Vereniging.values)[number];

// ─── Transition maps ──────────────────────────────────────────────────────

export const VALID_INVITATION_TRANSITIONS: Record<
  InvitationStatus,
  readonly InvitationStatus[]
> = {
  pending: ["attending", "not_attending", "maybe"],
  attending: ["not_attending"],
  maybe: ["attending", "not_attending"],
  not_attending: [],
} as const;

export function isValidInvitationTransition(
  from: InvitationStatus,
  to: InvitationStatus,
): boolean {
  return VALID_INVITATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  sent: ["seen", "withdrawn"],
  seen: ["liked", "maybe", "rejected", "withdrawn"],
  liked: ["invited", "maybe", "rejected", "withdrawn"],
  maybe: ["liked", "invited", "rejected", "withdrawn"],
  rejected: [],
  invited: [
    "attending",
    "not_attending",
    "accepted",
    "not_chosen",
    "withdrawn",
  ],
  attending: ["accepted", "not_chosen"],
  not_attending: [],
  accepted: [],
  not_chosen: [],
  withdrawn: [],
} as const;

export function isValidApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return VALID_APPLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_ROOM_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> =
  {
    draft: ["active"],
    active: ["paused", "closed"],
    paused: ["active", "closed"],
    closed: [],
  } as const;

export function isValidRoomTransition(
  from: RoomStatus,
  to: RoomStatus,
): boolean {
  return VALID_ROOM_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_REPORT_STATUS_TRANSITIONS: Record<
  ReportStatus,
  readonly ReportStatus[]
> = {
  pending: ["reviewing", "dismissed"],
  reviewing: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
} as const;

export function isValidReportStatusTransition(
  from: ReportStatus,
  to: ReportStatus,
): boolean {
  return VALID_REPORT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Application status categories ────────────────────────────────────────

export const TERMINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.rejected,
  ApplicationStatus.accepted,
  ApplicationStatus.not_chosen,
  ApplicationStatus.withdrawn,
  ApplicationStatus.not_attending,
] as const;

export function isTerminalApplicationStatus(
  status: ApplicationStatus,
): boolean {
  return (TERMINAL_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export const INVITABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.seen,
  ApplicationStatus.liked,
  ApplicationStatus.maybe,
] as const;

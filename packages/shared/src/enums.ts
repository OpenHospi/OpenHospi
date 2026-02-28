// Single source of truth for UI + validation
// Every enum maps 1:1 to a SQL enum and translation key: enums.{enum_name}.{value}

export const GENDERS = ["man", "vrouw", "zeg_ik_liever_niet"] as const;
export type Gender = (typeof GENDERS)[number];
export const Gender = {
    man: "man",
    vrouw: "vrouw",
    zeg_ik_liever_niet: "zeg_ik_liever_niet",
} as const satisfies Record<Gender, Gender>;

export const GENDER_PREFERENCES = ["man", "vrouw", "geen_voorkeur"] as const;
export type GenderPreference = (typeof GENDER_PREFERENCES)[number];
export const GenderPreference = {
    man: "man",
    vrouw: "vrouw",
    geen_voorkeur: "geen_voorkeur",
} as const satisfies Record<GenderPreference, GenderPreference>;

export const LANGUAGES = [
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
] as const;
export type Language = (typeof LANGUAGES)[number];

export const AFFILIATIONS = ["student", "employee", "staff"] as const;
export type Affiliation = (typeof AFFILIATIONS)[number];

export const STUDY_LEVELS = [
    "mbo",
    "hbo_propedeuse",
    "hbo_bachelor",
    "wo_propedeuse",
    "wo_bachelor",
    "pre_master",
    "master",
    "phd",
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

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
            return STUDY_LEVELS;
    }
}

export const LIFESTYLE_TAGS = [
    // Social vibe
    "gezellig",
    "rustig",
    "introvert",
    "extravert",
    // Activities
    "sporten",
    "koken",
    "gamen",
    "muziek",
    "uitgaan",
    "feesten",
    "studeren",
    "lezen",
    "reizen",
    "filmavond",
    "creatief",
    // Living rhythm
    "vroege_vogel",
    "nachtbraker",
    // Household
    "schoon",
    "relaxed_met_schoonmaken",
    // Diet & lifestyle
    "vegetarisch",
    "vegan",
    "duurzaam",
    // Social values
    "inclusief",
    "internationaal",
    "huisdieren",
] as const;
export type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

export const HOUSE_TYPES = [
    "studentenhuis",
    "appartement",
    "studio",
    "woongroep",
    "anti_kraak",
] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];

export const ROOM_STATUSES = ["draft", "active", "paused", "closed"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];
export const RoomStatus = {
    draft: "draft",
    active: "active",
    paused: "paused",
    closed: "closed",
} as const satisfies Record<RoomStatus, RoomStatus>;

export const FURNISHINGS = ["kaal", "gestoffeerd", "gemeubileerd"] as const;
export type Furnishing = (typeof FURNISHINGS)[number];

export const ROOM_FEATURES = [
    "eigen_badkamer",
    "gedeelde_badkamer",
    "eigen_keuken",
    "gedeelde_keuken",
    "balkon",
    "tuin",
    "terras",
    "berging",
    "parkeerplaats",
    "fietsenstalling",
    "wasmachine",
    "droger",
    "vaatwasser",
    "wifi_inbegrepen",
    "huisdieren_toegestaan",
    "roken_toegestaan",
    "geen_huisdieren",
    "niet_roken",
] as const;
export type RoomFeature = (typeof ROOM_FEATURES)[number];

export const RENTAL_TYPES = ["vast", "onderhuur", "tijdelijk"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];
export const RentalType = {
    vast: "vast",
    onderhuur: "onderhuur",
    tijdelijk: "tijdelijk",
} as const satisfies Record<RentalType, RentalType>;

export const LOCATION_TAGS = [
    "dichtbij_universiteit",
    "dichtbij_station",
    "dichtbij_ov",
    "dichtbij_centrum",
    "dichtbij_supermarkt",
    "dichtbij_uitgaan",
    "dichtbij_sportcentrum",
    "dichtbij_park",
    "rustige_buurt",
    "levendige_buurt",
] as const;
export type LocationTag = (typeof LOCATION_TAGS)[number];

export const CITIES = [
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
] as const;
export type City = (typeof CITIES)[number];

export const APPLICATION_STATUSES = [
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
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const ApplicationStatus = {
    sent: "sent",
    seen: "seen",
    liked: "liked",
    maybe: "maybe",
    rejected: "rejected",
    invited: "invited",
    attending: "attending",
    not_attending: "not_attending",
    accepted: "accepted",
    not_chosen: "not_chosen",
    withdrawn: "withdrawn",
} as const satisfies Record<ApplicationStatus, ApplicationStatus>;

export const REVIEW_DECISIONS = ["like", "maybe", "reject"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];
export const ReviewDecision = {
    like: "like",
    maybe: "maybe",
    reject: "reject",
} as const satisfies Record<ReviewDecision, ReviewDecision>;

export const INVITATION_STATUSES = [
    "pending",
    "attending",
    "not_attending",
    "maybe",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];
export const InvitationStatus = {
    pending: "pending",
    attending: "attending",
    not_attending: "not_attending",
    maybe: "maybe",
} as const satisfies Record<InvitationStatus, InvitationStatus>;

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

export const HOUSE_MEMBER_ROLES = ["owner", "member"] as const;
export type HouseMemberRole = (typeof HOUSE_MEMBER_ROLES)[number];
export const HouseMemberRole = {
    owner: "owner",
    member: "member",
} as const satisfies Record<HouseMemberRole, HouseMemberRole>;

export const CONVERSATION_TYPES = ["direct", "house"] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const MESSAGE_TYPES = ["text", "system"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const DELIVERY_STATUSES = ["sent", "delivered", "read"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const ADMIN_ACTIONS = [
    "view_report",
    "update_report",
    "suspend_user",
    "unsuspend_user",
    "remove_listing",
    "remove_message",
    "dismiss_report",
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];
export const AdminAction = {
    view_report: "view_report",
    update_report: "update_report",
    suspend_user: "suspend_user",
    unsuspend_user: "unsuspend_user",
    remove_listing: "remove_listing",
    remove_message: "remove_message",
    dismiss_report: "dismiss_report",
} as const satisfies Record<AdminAction, AdminAction>;

export const REPORT_REASONS = [
    "spam",
    "harassment",
    "fake_profile",
    "inappropriate_content",
    "scam",
    "discrimination",
    "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const ReportReason = {
    spam: "spam",
    harassment: "harassment",
    fake_profile: "fake_profile",
    inappropriate_content: "inappropriate_content",
    scam: "scam",
    discrimination: "discrimination",
    other: "other",
} as const satisfies Record<ReportReason, ReportReason>;

export const REPORT_TYPES = [
    "message",
    "user",
    "room",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const ReportType = {
    message: "message",
    user: "user",
    room: "room",
} as const satisfies Record<ReportType, ReportType>;

export const REPORT_STATUSES = [
    "pending",
    "reviewing",
    "resolved",
    "dismissed",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const ReportStatus = {
    pending: "pending",
    reviewing: "reviewing",
    resolved: "resolved",
    dismissed: "dismissed",
} as const satisfies Record<ReportStatus, ReportStatus>;

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

export const VALID_APPLICATION_TRANSITIONS: Record<
    ApplicationStatus,
    readonly ApplicationStatus[]
> = {
    sent: ["seen", "withdrawn"],
    seen: ["liked", "maybe", "rejected", "withdrawn"],
    liked: ["invited", "maybe", "rejected", "withdrawn"],
    maybe: ["liked", "invited", "rejected", "withdrawn"],
    rejected: [],
    invited: ["attending", "not_attending", "accepted", "not_chosen", "withdrawn"],
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

// Room status transitions
export const VALID_ROOM_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
    draft: ["active"],
    active: ["paused", "closed"],
    paused: ["active", "closed"],
    closed: [],
} as const;

export function isValidRoomTransition(from: RoomStatus, to: RoomStatus): boolean {
    return VALID_ROOM_TRANSITIONS[from]?.includes(to) ?? false;
}

// Application status categories
export const TERMINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
    "rejected", "accepted", "not_chosen", "withdrawn", "not_attending",
] as const;

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
    return (TERMINAL_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export const INVITABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
    "seen", "liked", "maybe",
] as const;

// Discover sort
export const DISCOVER_SORTS = ["newest", "cheapest", "most_expensive"] as const;
export type DiscoverSort = (typeof DISCOVER_SORTS)[number];
export const DiscoverSort = {
    newest: "newest",
    cheapest: "cheapest",
    most_expensive: "most_expensive",
} as const satisfies Record<DiscoverSort, DiscoverSort>;

export const VERENIGINGEN = [
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
    "anders",
] as const;
export type Vereniging = (typeof VERENIGINGEN)[number];


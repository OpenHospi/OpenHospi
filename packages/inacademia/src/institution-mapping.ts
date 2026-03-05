export interface InstitutionInfo {
  short: string;
  name: { nl: string; en: string };
}

/**
 * Maps SAML entity IDs (from InAcademia's `idp_hint` claim) to institution info.
 * Source: https://github.com/InAcademia/aarc_idp_hint/blob/main/nl.json
 *
 * Well-known institutions have curated short codes.
 * TODO: Add remaining ~150 entries from nl.json
 */
export const INSTITUTION_MAP = new Map<string, InstitutionInfo>([
  // ─── Research Universities (WO) ────────────────────────────────────────
  ["https://sts.windows.net/715902d6-f63e-4b8d-929b-4bb170bad492/", {
    short: "EUR",
    name: { nl: "Erasmus Universiteit Rotterdam", en: "Erasmus University Rotterdam" },
  }],
  ["https://sts.windows.net/084578d9-400d-4a5a-a7c7-e76ca47af400/", {
    short: "RU",
    name: { nl: "Radboud Universiteit", en: "Radboud University" },
  }],
  ["https://signon.rug.nl/nidp/saml2/metadata", {
    short: "RUG",
    name: { nl: "Rijksuniversiteit Groningen", en: "University of Groningen" },
  }],
  ["https://sts.windows.net/cc7df247-60ce-4a0f-9d75-704cf60efc64/", {
    short: "TU/e",
    name: { nl: "Technische Universiteit Eindhoven", en: "Eindhoven University of Technology" },
  }],
  ["https://login.tudelft.nl/sso/saml2/idp/metadata.php", {
    short: "TUD",
    name: { nl: "Technische Universiteit Delft", en: "Delft University of Technology" },
  }],
  ["https://sts.windows.net/7a5561df-6599-4898-8a20-cce41db3b44f/", {
    short: "TiU",
    name: { nl: "Tilburg University", en: "Tilburg University" },
  }],
  ["http://login.maastrichtuniversity.nl/adfs/services/trust", {
    short: "UM",
    name: { nl: "Universiteit Maastricht", en: "Maastricht University" },
  }],
  ["http://login.uva.nl/adfs/services/trust", {
    short: "UvA",
    name: { nl: "Universiteit van Amsterdam", en: "University of Amsterdam" },
  }],
  ["https://sts.windows.net/723246a1-c3f5-43c5-acdc-43adb404ac4d/", {
    short: "UT",
    name: { nl: "Universiteit Twente", en: "University of Twente" },
  }],
  ["https://login.uu.nl/nidp/saml2/metadata", {
    short: "UU",
    name: { nl: "Universiteit Utrecht", en: "Utrecht University" },
  }],
  ["http://stsfed.login.vu.nl/adfs/services/trust", {
    short: "VU",
    name: { nl: "Vrije Universiteit Amsterdam", en: "Vrije Universiteit Amsterdam" },
  }],
  ["https://sts.windows.net/27d137e5-761f-4dc1-af88-d26430abb18f/", {
    short: "WUR",
    name: { nl: "Wageningen University & Research (WUR)", en: "Wageningen University & Research (WUR)" },
  }],
  ["https://login.ou.nl/am", {
    short: "OU",
    name: { nl: "Open Universiteit", en: "Open Universiteit" },
  }],
  ["https://login.uaccess.leidenuniv.nl/nidp/saml2/metadata", {
    short: "UL",
    name: { nl: "Universiteit Leiden", en: "Leiden University" },
  }],
  ["http://adfs4.uvh.nl/adfs/services/trust", {
    short: "UvH",
    name: { nl: "Universiteit voor Humanistiek", en: "University of Humanistic Studies" },
  }],
  ["https://sts.windows.net/672799eb-10ac-4a8b-aeae-e288e053f500/", {
    short: "Nyenrode",
    name: { nl: "Nyenrode Business Universiteit", en: "Nyenrode Business Universiteit" },
  }],

  // ─── Universities of Applied Sciences (HBO) ───────────────────────────
  ["https://sts.windows.net/87c50b58-2ef2-423d-a4db-1fa7c84efcfa/", {
    short: "Avans",
    name: { nl: "Avans Hogeschool", en: "Avans University of Applied Sciences" },
  }],
  ["https://sts.windows.net/5d73e7b7-b3e1-4d00-b303-056140b2a3b4/", {
    short: "HAN",
    name: { nl: "Hogeschool van Arnhem en Nijmegen", en: "HAN University of Applied Sciences" },
  }],
  ["https://sts.windows.net/a3b39014-7adc-48fa-a114-37c2434dbd69/", {
    short: "Hanze",
    name: { nl: "Hanze", en: "Hanze University of Applied Sciences" },
  }],
  ["https://sts.windows.net/98932909-9a5a-4d18-ace4-7236b5b5e11d/", {
    short: "HU",
    name: { nl: "Hogeschool Utrecht", en: "University of Applied Sciences Utrecht" },
  }],
  ["http://login.hva.nl/adfs/services/trust", {
    short: "HvA",
    name: { nl: "Hogeschool van Amsterdam", en: "Amsterdam University of Applied Sciences" },
  }],
  ["https://sts.windows.net/c66b6765-b794-4a2b-84ed-845b341c086a/", {
    short: "Fontys",
    name: { nl: "Fontys Hogeschool", en: "Fontys University of Applied Sciences" },
  }],
  ["https://sts.windows.net/a77b0754-fdc1-4a62-972c-8425ffbfcbd2/", {
    short: "Saxion",
    name: { nl: "Saxion Hogeschool", en: "Saxion University of Applied Sciences" },
  }],
  ["https://sts.windows.net/016a9e48-ba0b-49f4-97f8-a88352164e58/", {
    short: "NHL Stenden",
    name: { nl: "NHL Stenden Hogeschool", en: "NHL Stenden University of Applied Sciences" },
  }],
  ["https://access.hro.nl/simplesaml/saml2/idp/metadata.php", {
    short: "HR",
    name: { nl: "Hogeschool Rotterdam", en: "Rotterdam University of Applied Sciences" },
  }],
  ["http://sts.windesheim.nl/adfs/services/trust", {
    short: "Windesheim",
    name: { nl: "Hogeschool Windesheim", en: "University of Applied Sciences Windesheim" },
  }],
  ["https://sts.windows.net/a2586b9b-f867-4b3c-9363-5b435c5dbc45/", {
    short: "HHS",
    name: { nl: "De Haagse Hogeschool (HHS)", en: "The Hague University of Applied Sciences (THUAS)" },
  }],
  ["https://sts.windows.net/ad78d191-1044-4303-8212-b6f4dd7874bc/", {
    short: "Inholland",
    name: { nl: "Hogeschool Inholland", en: "Inholland University of Applied Sciences" },
  }],
  ["http://fs.myhz.nl/adfs/services/trust", {
    short: "HZ",
    name: { nl: "HZ University of Applied Sciences", en: "HZ University of Applied Sciences" },
  }],
  ["https://sts.windows.net/850f9344-e078-467e-9c5e-84d82f208ac7/", {
    short: "HL",
    name: { nl: "Hogeschool Leiden", en: "University of Applied Sciences Leiden" },
  }],
  ["https://sts.windows.net/0a33589b-0036-4fe8-a829-3ed0926af886/", {
    short: "BUas",
    name: { nl: "Breda University of Applied Sciences", en: "Breda University of Applied Sciences" },
  }],
  ["https://sts.windows.net/8e1dfee2-977a-438c-b35e-f5b6da84a174/", {
    short: "Zuyd",
    name: { nl: "Zuyd Hogeschool", en: "Zuyd University of Applied Sciences" },
  }],
  ["http://adfs.hvhl.nl/adfs/services/trust", {
    short: "VHL",
    name: { nl: "Hogeschool Van Hall Larenstein", en: "Van Hall Larenstein, University of Applied Sciences" },
  }],
  ["https://sts.windows.net/76fa7ce1-3aee-4a50-9446-7e4e352770e7/", {
    short: "Hotelschool",
    name: { nl: "Hotelschool The Hague", en: "Hotelschool The Hague" },
  }],
  ["https://sts.windows.net/cc9f232a-9851-46b0-b23e-641d680590df/", {
    short: "HAS",
    name: { nl: "HAS green academy", en: "HAS green academy" },
  }],

  // ─── Arts Universities ─────────────────────────────────────────────────
  ["https://sts.windows.net/6572d2c2-3e99-4784-a466-235eb1d580e9/", {
    short: "AHK",
    name: { nl: "Amsterdamse Hogeschool voor de Kunsten", en: "Amsterdam University of the Arts" },
  }],
  ["https://sts.windows.net/c2e4234e-9ccc-490e-8151-acd2ed2b1779/", {
    short: "ArtEZ",
    name: { nl: "ArtEZ University of the Arts", en: "ArtEZ University of the Arts" },
  }],
  ["https://sts.windows.net/aabe793f-b39c-440c-8e1a-0dcfb6215609/", {
    short: "Codarts",
    name: { nl: "Codarts Hogeschool voor de Kunsten", en: "Codarts University of the Arts" },
  }],
  ["https://federatie.hku.nl", {
    short: "HKU",
    name: { nl: "Hogeschool voor de Kunsten Utrecht", en: "Utrecht School of the Arts" },
  }],
  ["https://sts.windows.net/496e7d4d-a026-4e7e-87c3-176f39bc8238/", {
    short: "KABK",
    name: { nl: "Hogeschool der Kunsten Den Haag", en: "University of the Arts The Hague" },
  }],
  ["http://sts.rietveldacademie.nl/adfs/services/trust", {
    short: "Rietveld",
    name: { nl: "Gerrit Rietveld Academie", en: "Gerrit Rietveld Academie" },
  }],
  ["https://sts.windows.net/2c1cfd24-625c-489e-b1fc-8f745830ea67/", {
    short: "DAE",
    name: { nl: "Design Academy Eindhoven", en: "Design Academy Eindhoven" },
  }],

  // ─── UMCs ──────────────────────────────────────────────────────────────
  ["http://sts.amsterdamumc.nl/adfs/services/trust", {
    short: "Amsterdam UMC",
    name: { nl: "Amsterdam UMC", en: "Amsterdam UMC" },
  }],
  ["http://logon.erasmusmc.nl/adfs/services/trust", {
    short: "Erasmus MC",
    name: { nl: "Erasmus MC", en: "Erasmus MC" },
  }],
  ["https://sts.windows.net/335122f9-d4f4-4d67-a2fc-cd6dc20dde70/", {
    short: "UMCG",
    name: { nl: "UMC Groningen", en: "UMC Groningen" },
  }],
  ["http://fs.umcutrecht.nl/adfs/services/trust", {
    short: "UMC Utrecht",
    name: { nl: "Universitair Medisch Centrum Utrecht", en: "Universitair Medisch Centrum Utrecht" },
  }],
  ["http://federatie.lumc.nl/adfs/services/trust", {
    short: "LUMC",
    name: { nl: "Leids Universitair Medisch Centrum", en: "Leids Universitair Medisch Centrum" },
  }],
  ["http://auth.mumc.nl/adfs/services/trust", {
    short: "MUMC+",
    name: { nl: "Maastricht Universitair Medisch Centrum", en: "Maastricht University Medical Center" },
  }],
  ["https://sts.windows.net/b208fe69-471e-48c4-8d87-025e9b9a157f/", {
    short: "Radboudumc",
    name: { nl: "Radboudumc", en: "Radboudumc" },
  }],

  // ─── MBO (well-known) ─────────────────────────────────────────────────
  ["https://sts.windows.net/c908cc46-554c-4131-8653-45522e68e291/", {
    short: "ROCvA",
    name: { nl: "ROC van Amsterdam - Flevoland en het VOvA", en: "ROC van Amsterdam - Flevoland en het VOvA" },
  }],
  ["https://sts.windows.net/b5c9c18a-44f0-434b-85fb-951322bf0eac/", {
    short: "ROC MN",
    name: { nl: "ROC Midden Nederland", en: "ROC Midden Nederland" },
  }],
  ["https://sts.windows.net/0ace682c-5851-4d9f-863a-2c2a3340212d/", {
    short: "Albeda",
    name: { nl: "ROC Albeda", en: "ROC Albeda" },
  }],
  ["https://sts.windows.net/bbf63f12-ffda-40f9-93ee-a4e59d1649cf/", {
    short: "ROC Twente",
    name: { nl: "ROC van Twente", en: "ROC van Twente" },
  }],

  // ─── Other notable institutions ────────────────────────────────────────
  ["https://conext.authenticatie.ru.nl/simplesaml/saml2/idp/metadata.php", {
    short: "RU (USEZ)",
    name: { nl: "Radboud Universiteit (USEZ-account)", en: "Radboud University (USEZ-account)" },
  }],
  ["http://idp.ihe.nl/adfs/services/trust", {
    short: "IHE Delft",
    name: { nl: "IHE Delft Institute for Water Education", en: "IHE Delft Institute for Water Education" },
  }],
  ["https://sts.windows.net/63817156-fe48-4e3c-8277-19db53d4dc59/", {
    short: "UCR",
    name: { nl: "University College Roosevelt", en: "University College Roosevelt" },
  }],
  ["https://login.eduid.nl", {
    short: "eduID",
    name: { nl: "eduID", en: "eduID (NL)" },
  }],
  ["http://adfs.tio.nl/adfs/services/trust", {
    short: "Tio",
    name: { nl: "Tio Business School", en: "Tio Business School" },
  }],
]);

export function getInstitution(entityId: string): InstitutionInfo {
  return INSTITUTION_MAP.get(entityId) ?? {
    short: "?",
    name: { nl: entityId, en: entityId },
  };
}

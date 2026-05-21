export type CertificationPath = "registration" | "self" | "digital";

export type DocumentRequirement = {
  id: string;
  label: string;
  description: string;
  requiredFor: CertificationPath[];
  countryGroup: "base" | "africa" | "us";
};

export type DocumentChecklist = {
  countryGroup: "africa" | "us" | "global";
  path: CertificationPath;
  requirements: DocumentRequirement[];
};

const BASE_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "incorporation_business_registration",
    label: "Incorporation / business registration document",
    description: "Certificate of incorporation, business registration extract, or equivalent formation record.",
    requiredFor: ["registration", "self", "digital"],
    countryGroup: "base",
  },
  {
    id: "ownership_proof",
    label: "Ownership proof",
    description: "Shareholding, membership, cap table, or beneficial ownership evidence.",
    requiredFor: ["digital"],
    countryGroup: "base",
  },
  {
    id: "women_ownership_declaration",
    label: "Women ownership declaration",
    description: "Signed declaration confirming women ownership status.",
    requiredFor: ["digital"],
    countryGroup: "base",
  },
  {
    id: "hr_role_document",
    label: "HR / role document",
    description: "Org chart, role letter, appointment record, or employment evidence.",
    requiredFor: ["digital"],
    countryGroup: "base",
  },
  {
    id: "existing_wbe_certificate",
    label: "Existing WBE / WE Bank / WBENC-equivalent certificate",
    description: "Current third-party diversity or women-owned business certificate.",
    requiredFor: [],
    countryGroup: "base",
  },
];

const AFRICA_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "africa_business_registration_record",
    label: "Africa business registration record",
    description: "Country registry extract, company registration certificate, or local business license.",
    requiredFor: ["digital"],
    countryGroup: "africa",
  },
  {
    id: "africa_shareholder_ownership_document",
    label: "Africa shareholder / ownership document",
    description: "Shareholder return, beneficial ownership filing, or ownership register.",
    requiredFor: ["digital"],
    countryGroup: "africa",
  },
  {
    id: "africa_owner_identity_proof",
    label: "Africa owner identity proof",
    description: "Passport, national ID, voter ID, or equivalent proof for principal owners.",
    requiredFor: ["digital"],
    countryGroup: "africa",
  },
  {
    id: "africa_independence_declaration",
    label: "Africa independence declaration",
    description: "Declaration that ownership and control are independent from non-qualifying entities.",
    requiredFor: ["digital"],
    countryGroup: "africa",
  },
];

const US_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "us_business_registration_record",
    label: "US business registration record",
    description: "Secretary of State record, articles of incorporation, LLC filing, or DBA record.",
    requiredFor: ["digital"],
    countryGroup: "us",
  },
  {
    id: "us_shareholder_ownership_document",
    label: "US shareholder / ownership document",
    description: "Stock ledger, operating agreement, membership register, or cap table.",
    requiredFor: ["digital"],
    countryGroup: "us",
  },
  {
    id: "us_independence_declaration",
    label: "US independence declaration",
    description: "Declaration confirming qualifying ownership is independent and unrestricted.",
    requiredFor: ["digital"],
    countryGroup: "us",
  },
];

const AFRICA_COUNTRY_NAMES = new Set([
  "algeria",
  "angola",
  "benin",
  "botswana",
  "burkina faso",
  "burundi",
  "cabo verde",
  "cameroon",
  "central african republic",
  "chad",
  "comoros",
  "congo",
  "democratic republic of the congo",
  "djibouti",
  "egypt",
  "equatorial guinea",
  "eritrea",
  "eswatini",
  "ethiopia",
  "gabon",
  "gambia",
  "ghana",
  "guinea",
  "guinea-bissau",
  "ivory coast",
  "kenya",
  "lesotho",
  "liberia",
  "libya",
  "madagascar",
  "malawi",
  "mali",
  "mauritania",
  "mauritius",
  "morocco",
  "mozambique",
  "namibia",
  "niger",
  "nigeria",
  "rwanda",
  "senegal",
  "seychelles",
  "sierra leone",
  "somalia",
  "south africa",
  "south sudan",
  "sudan",
  "tanzania",
  "togo",
  "tunisia",
  "uganda",
  "zambia",
  "zimbabwe",
]);

function normalizeCountry(country: string) {
  return country.trim().toLowerCase();
}

export function resolveDocumentCountryGroup(country: string): DocumentChecklist["countryGroup"] {
  const normalized = normalizeCountry(country);
  if (!normalized) return "global";
  if (["us", "usa", "u.s.", "u.s.a.", "united states", "united states of america"].includes(normalized)) {
    return "us";
  }
  if (AFRICA_COUNTRY_NAMES.has(normalized)) return "africa";
  return "global";
}

export function normalizeCertificationPath(path: string | null | undefined): CertificationPath {
  if (path === "self" || path === "digital") return path;
  return "registration";
}

export function getDocumentChecklist(country: string, path: string | null | undefined): DocumentChecklist {
  const normalizedPath = normalizeCertificationPath(path);
  const countryGroup = resolveDocumentCountryGroup(country);
  const countryRequirements =
    countryGroup === "us" ? US_REQUIREMENTS : countryGroup === "africa" ? AFRICA_REQUIREMENTS : [];

  return {
    countryGroup,
    path: normalizedPath,
    requirements: [...BASE_REQUIREMENTS, ...countryRequirements],
  };
}

export function getMissingRequiredDocumentIds(
  checklist: DocumentChecklist,
  uploadedRequirementIds: string[],
): string[] {
  const uploaded = new Set(uploadedRequirementIds);
  return checklist.requirements
    .filter((requirement) => requirement.requiredFor.includes(checklist.path))
    .filter((requirement) => !uploaded.has(requirement.id))
    .map((requirement) => requirement.id);
}

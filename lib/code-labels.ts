import { NAICS_CODES, UNSPSC_CODES } from "./constants";

type CodeEntry = {
  code: string;
  label: string;
};

const NAICS_EXACT_LABELS: Record<string, string> = {
  "511210": "Software Publishers",
  "541511": "Custom Computer Programming Services",
  "541512": "Computer Systems Design Services",
  "722511": "Full-Service Restaurants",
  "722513": "Limited-Service Restaurants",
};

const NAICS_PREFIX_LABELS: Array<CodeEntry> = [
  { code: "5415", label: "Computer Systems Design and Related Services" },
  { code: "7225", label: "Restaurants and Other Eating Places" },
  { code: "484", label: "Truck Transportation" },
  { code: "4885", label: "Freight Transportation Arrangement" },
  { code: "492", label: "Couriers and Messengers" },
  { code: "493", label: "Warehousing and Storage" },
];

const UNSPSC_EXACT_LABELS: Record<string, string> = {
  "43232107": "Project management software",
  "43232304": "Data base management system software",
  "78101800": "Road cargo transport",
  "81110000": "Computer services",
  "81112200": "Software maintenance and support",
  "90101500": "Eating and drinking establishments",
};

function normalizeCode(code: string) {
  return String(code).trim();
}

function labelFromCatalog(code: string, catalog: CodeEntry[]) {
  return catalog.find((entry) => entry.code === code)?.label;
}

function labelFromNaicsHierarchy(code: string) {
  const exact = labelFromCatalog(code, NAICS_CODES) ?? NAICS_EXACT_LABELS[code];
  if (exact) return exact;

  const prefix = NAICS_PREFIX_LABELS.find((entry) => code.startsWith(entry.code));
  if (prefix) return prefix.label;

  if (code.startsWith("31") || code.startsWith("32") || code.startsWith("33")) {
    return "Manufacturing";
  }
  if (code.startsWith("44") || code.startsWith("45")) {
    return "Retail Trade";
  }
  if (code.startsWith("48") || code.startsWith("49")) {
    return "Transportation and Warehousing";
  }

  return labelFromCatalog(code.slice(0, 2), NAICS_CODES);
}

function labelFromUnspscHierarchy(code: string) {
  return labelFromCatalog(code, UNSPSC_CODES) ?? UNSPSC_EXACT_LABELS[code] ?? labelFromCatalog(`${code.slice(0, 2)}000000`, UNSPSC_CODES);
}

export function getNaicsMeaning(code: string) {
  const normalized = normalizeCode(code);
  return labelFromNaicsHierarchy(normalized) ?? "Description not available";
}

export function getUnspscMeaning(code: string) {
  const normalized = normalizeCode(code);
  return labelFromUnspscHierarchy(normalized) ?? "Description not available";
}

export function formatNaicsCode(code: string) {
  const normalized = normalizeCode(code);
  return `${normalized} - ${getNaicsMeaning(normalized)}`;
}

export function formatUnspscCode(code: string) {
  const normalized = normalizeCode(code);
  return `${normalized} - ${getUnspscMeaning(normalized)}`;
}

export function formatNaicsCodes(codes: string[]) {
  return codes.map(formatNaicsCode);
}

export function formatUnspscCodes(codes: string[]) {
  return codes.map(formatUnspscCode);
}

export function formatCodeList(codes: string[], kind: "naics" | "unspsc", empty = "N/A") {
  if (!codes.length) return empty;
  const formatted = kind === "naics" ? formatNaicsCodes(codes) : formatUnspscCodes(codes);
  return formatted.join(", ");
}

import registryCompanies from "./registry-kb.json";
import type { RegistrationDraft } from "./registration";
import type { RegistryCompany } from "./types";

export type UploadedDocument = {
  base64: string;
  mimeType: string;
  requirementId?: string;
  requirementLabel?: string;
  fileName?: string;
};

export type DocumentTriangulationResult = {
  verified: boolean;
  confidence: number;
  report: string;
  mismatchReasons: string[];
  matchedSignals: string[];
  extracted: {
    companyNames: string[];
    registrationNumbers: string[];
    owners: string[];
    jurisdictions: string[];
  };
};

const KNOWN_COMPANIES = registryCompanies as RegistryCompany[];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function hasSignal(haystack: string, needle: string) {
  const cleanNeedle = normalize(needle);
  return Boolean(cleanNeedle) && haystack.includes(cleanNeedle);
}

function registryNumbersFromSnippet(snippet: string) {
  const matches = snippet.match(/(?:#|CNPJ\s*)[A-Z0-9./-]+/gi) ?? [];
  return matches.map((match) => match.trim());
}

function countryFromJurisdiction(jurisdiction: string) {
  return jurisdiction.split(/[—-]/)[0]?.trim() ?? jurisdiction;
}

export function decodeDocumentText(documents: UploadedDocument[]) {
  return documents
    .map((doc) => Buffer.from(doc.base64, "base64").toString("latin1"))
    .join("\n")
    .replace(/\0/g, " ");
}

export function findRegistryCompanyForRegistration(
  registration: Pick<RegistrationDraft, "business_name">,
  companySnapshot?: RegistryCompany,
) {
  if (companySnapshot?.companyName) return companySnapshot;
  const businessName = normalize(registration.business_name);
  return KNOWN_COMPANIES.find((company) =>
    [company.companyName, ...company.aliases].some((name) => normalize(name) === businessName),
  );
}

function detectKnownCompanies(normalizedText: string) {
  return KNOWN_COMPANIES.filter((company) =>
    [company.companyName, ...company.aliases].some((name) => hasSignal(normalizedText, name)),
  );
}

function extractSignals(normalizedText: string, registryCompany?: RegistryCompany) {
  const companyNames = detectKnownCompanies(normalizedText).map((company) => company.companyName);
  const registrationNumbers = unique(
    [
      ...(registryCompany ? registryNumbersFromSnippet(registryCompany.registrySnippet) : []),
      "#08472931",
      "CNPJ 12.345.678/0001-90",
    ].filter((number) => hasSignal(normalizedText, number)),
  );
  const owners = unique(
    KNOWN_COMPANIES.flatMap((company) => [company.primaryOwner, ...company.directors]).filter((name) =>
      hasSignal(normalizedText, name),
    ),
  );
  const jurisdictions = unique(
    KNOWN_COMPANIES.map((company) => countryFromJurisdiction(company.jurisdiction)).filter((jurisdiction) =>
      hasSignal(normalizedText, jurisdiction),
    ),
  );

  return { companyNames, registrationNumbers, owners, jurisdictions };
}

export function triangulateDocuments(
  registration: RegistrationDraft,
  documents: UploadedDocument[],
  companySnapshot?: RegistryCompany,
): DocumentTriangulationResult {
  const rawText = decodeDocumentText(documents);
  const normalizedText = normalize(rawText);
  const expectedCompany = findRegistryCompanyForRegistration(registration, companySnapshot);
  const expectedNames = unique([
    registration.business_name,
    expectedCompany?.companyName ?? "",
    ...(expectedCompany?.aliases ?? []),
  ]);
  const expectedOwners = unique([
    ...registration.owner_details.map((owner) => owner.fullName),
    expectedCompany?.primaryOwner ?? "",
    ...(expectedCompany?.directors ?? []),
  ]);
  const expectedJurisdiction = expectedCompany
    ? countryFromJurisdiction(expectedCompany.jurisdiction)
    : registration.country;
  const expectedRegistryNumbers = expectedCompany
    ? registryNumbersFromSnippet(expectedCompany.registrySnippet)
    : [];

  const extracted = extractSignals(normalizedText, expectedCompany);
  const matchedSignals: string[] = [];
  const mismatchReasons: string[] = [];

  const companyMatched = expectedNames.some((name) => hasSignal(normalizedText, name));
  if (companyMatched) {
    matchedSignals.push("business name");
  } else {
    mismatchReasons.push(`Business name does not match ${registration.business_name}.`);
  }

  const wrongKnownCompany = detectKnownCompanies(normalizedText).find(
    (company) => expectedCompany && company.id !== expectedCompany.id,
  );
  if (wrongKnownCompany) {
    mismatchReasons.push(`Uploaded document appears to belong to ${wrongKnownCompany.companyName}.`);
  }

  const registryMatched =
    expectedRegistryNumbers.length === 0 ||
    expectedRegistryNumbers.some((number) => hasSignal(normalizedText, number));
  if (registryMatched) {
    if (expectedRegistryNumbers.length) matchedSignals.push("registry number");
  } else {
    mismatchReasons.push(`Registry number does not match ${expectedRegistryNumbers.join(" or ")}.`);
  }

  const jurisdictionMatched = hasSignal(normalizedText, expectedJurisdiction) || hasSignal(normalizedText, registration.country);
  if (jurisdictionMatched) {
    matchedSignals.push("jurisdiction");
  } else {
    mismatchReasons.push(`Jurisdiction does not match ${expectedJurisdiction || registration.country}.`);
  }

  const ownerMatched = expectedOwners.some((name) => hasSignal(normalizedText, name));
  if (ownerMatched) {
    matchedSignals.push("owner/director");
  } else {
    mismatchReasons.push("No registered owner or director from the application was found in the document.");
  }

  const verified = mismatchReasons.length === 0 && matchedSignals.length >= 3;
  const confidence = verified
    ? Math.min(96, 70 + matchedSignals.length * 6)
    : Math.max(15, 70 - mismatchReasons.length * 18);
  const report = verified
    ? `Triangulation passed: ${matchedSignals.join(", ")} matched the registration and registry evidence.`
    : `Document mismatch: ${mismatchReasons.join(" ")}`;

  return {
    verified,
    confidence,
    report,
    mismatchReasons,
    matchedSignals,
    extracted,
  };
}

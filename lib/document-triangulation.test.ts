import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { triangulateDocuments } from "./document-triangulation";
import type { RegistrationDraft } from "./registration";
import type { RegistryCompany } from "./types";

const globalTech: RegistryCompany = {
  id: "global-tech",
  companyName: "Global Tech Solutions Ltd",
  aliases: ["Global Tech Solutions", "globaltechsolutions.co.uk", "global tech"],
  websiteUrl: "https://globaltechsolutions.example",
  jurisdiction: "UK — Companies House",
  registrySnippet: "Company #08472931 · Incorporated 2013 · Active",
  primaryOwner: "Maria Silva",
  ownershipFemalePct: 60,
  directors: ["Maria Silva", "James Okonkwo"],
  riskFlags: [],
};

const nileLogistics: RegistryCompany = {
  id: "nile-logistics",
  companyName: "Nile Logistics SA",
  aliases: ["Nile Logistics", "nile-logistics.com", "nile logistics sa"],
  websiteUrl: "https://nile-logistics.example",
  jurisdiction: "Brazil — Junta Comercial",
  registrySnippet: "CNPJ 12.345.678/0001-90 · Microempresa",
  primaryOwner: "Ana Costa",
  ownershipFemalePct: 100,
  directors: ["Ana Costa", "Paulo Mendes"],
  riskFlags: ["recent_director_change"],
};

function registration(company: RegistryCompany): RegistrationDraft {
  return {
    business_name: company.companyName,
    women_owned: true,
    country: company.jurisdiction.split("—")[0].trim(),
    us_citizen: null,
    visa_type: "",
    webank_certified: null,
    naics_codes: ["541511"],
    unspsc_codes: ["81110000"],
    designations: [],
    owner_details: [{ fullName: company.primaryOwner, gender: "female", ownershipPct: company.ownershipFemalePct }],
    num_employees: "11-50",
    revenue_range: "$1M-$5M",
    additional_certs: [],
    business_description: `${company.companyName} demo registration`,
    cert_type: "self",
    assessor: "",
    company_type: "Limited company",
    email: "seller@example.com",
    phone: "+10000000000",
  };
}

function sampleDocument(path: string) {
  return {
    base64: readFileSync(path).toString("base64"),
    mimeType: "application/pdf",
  };
}

describe("document triangulation", () => {
  it("verifies a matching Global Tech sample document", () => {
    const result = triangulateDocuments(
      registration(globalTech),
      [sampleDocument("public/sample-documents/global-tech-solutions-verification.pdf")],
      globalTech,
    );

    expect(result.verified).toBe(true);
    expect(result.matchedSignals).toContain("business name");
    expect(result.matchedSignals).toContain("registry number");
    expect(result.matchedSignals).toContain("owner/director");
  });

  it("rejects a Nile document uploaded for Global Tech registration", () => {
    const result = triangulateDocuments(
      registration(globalTech),
      [sampleDocument("public/sample-documents/nile-logistics-verification.pdf")],
      globalTech,
    );

    expect(result.verified).toBe(false);
    expect(result.report).toContain("Nile Logistics SA");
    expect(result.mismatchReasons.some((reason) => reason.includes("Global Tech Solutions Ltd"))).toBe(true);
  });

  it("verifies a matching Nile Logistics sample document", () => {
    const result = triangulateDocuments(
      registration(nileLogistics),
      [sampleDocument("public/sample-documents/nile-logistics-verification.pdf")],
      nileLogistics,
    );

    expect(result.verified).toBe(true);
    expect(result.matchedSignals).toContain("business name");
    expect(result.matchedSignals).toContain("registry number");
  });
});

import { describe, expect, it } from "vitest";
import {
  getDocumentChecklist,
  getMissingRequiredDocumentIds,
  resolveDocumentCountryGroup,
} from "./document-requirements";

describe("document requirements", () => {
  it("requires only the base registration document for registration", () => {
    const checklist = getDocumentChecklist("United States", "registration");
    const required = checklist.requirements.filter((requirement) => requirement.requiredFor.includes("registration"));

    expect(required.map((requirement) => requirement.id)).toEqual(["incorporation_business_registration"]);
  });

  it("adds a US-specific checklist for US suppliers", () => {
    const checklist = getDocumentChecklist("USA", "digital");

    expect(checklist.countryGroup).toBe("us");
    expect(checklist.requirements.some((requirement) => requirement.id === "us_business_registration_record")).toBe(true);
    expect(checklist.requirements.some((requirement) => requirement.id === "africa_business_registration_record")).toBe(false);
  });

  it("adds an Africa-specific checklist for African suppliers", () => {
    const checklist = getDocumentChecklist("Kenya", "digital");

    expect(checklist.countryGroup).toBe("africa");
    expect(checklist.requirements.some((requirement) => requirement.id === "africa_business_registration_record")).toBe(true);
    expect(checklist.requirements.some((requirement) => requirement.id === "us_business_registration_record")).toBe(false);
  });

  it("requires only the base registration document for self verification", () => {
    const checklist = getDocumentChecklist("South Africa", "self");

    expect(getMissingRequiredDocumentIds(checklist, [])).toEqual(["incorporation_business_registration"]);
    expect(getMissingRequiredDocumentIds(checklist, ["incorporation_business_registration"])).toEqual([]);
  });

  it("finds missing required regional documents for digital certification", () => {
    const checklist = getDocumentChecklist("South Africa", "digital");

    expect(getMissingRequiredDocumentIds(checklist, [
      "incorporation_business_registration",
      "ownership_proof",
      "women_ownership_declaration",
      "hr_role_document",
    ])).toEqual([
      "africa_business_registration_record",
      "africa_shareholder_ownership_document",
      "africa_owner_identity_proof",
      "africa_independence_declaration",
    ]);
  });

  it("resolves country groups", () => {
    expect(resolveDocumentCountryGroup("United States")).toBe("us");
    expect(resolveDocumentCountryGroup("Nigeria")).toBe("africa");
    expect(resolveDocumentCountryGroup("Singapore")).toBe("global");
  });
});

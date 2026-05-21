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

  it("finds missing required documents for the active certification path", () => {
    const checklist = getDocumentChecklist("South Africa", "self");

    expect(getMissingRequiredDocumentIds(checklist, ["incorporation_business_registration"])).toEqual([
      "africa_business_registration_record",
    ]);
  });

  it("resolves country groups", () => {
    expect(resolveDocumentCountryGroup("United States")).toBe("us");
    expect(resolveDocumentCountryGroup("Nigeria")).toBe("africa");
    expect(resolveDocumentCountryGroup("Singapore")).toBe("global");
  });
});

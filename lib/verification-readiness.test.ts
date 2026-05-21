import { afterEach, describe, expect, it } from "vitest";
import { emptyRegistrationDraft } from "./registration";
import {
  createSession,
  deleteSession,
  setSessionCompany,
  setSessionPaid,
  setSessionRegistration,
  setSessionStage,
  setSessionVisionChecks,
  upsertSessionAiDocumentAssessment,
} from "./session-store";
import { patchDomainState, deleteDomainState } from "./store/domain-store";
import { verificationReadiness } from "./verification-readiness";

const sessionIds: string[] = [];

afterEach(() => {
  for (const id of sessionIds.splice(0)) {
    deleteSession(id);
    deleteDomainState(id);
  }
});

function readyDigitalSession() {
  const sessionId = `readiness-${crypto.randomUUID()}`;
  sessionIds.push(sessionId);
  const session = createSession(sessionId);
  setSessionRegistration(sessionId, {
    ...emptyRegistrationDraft(),
    business_name: "Certification Ready LLC",
    country: "United States",
    naics_codes: ["54"],
    unspsc_codes: ["80000000"],
    owner_details: [{ fullName: "Asha Patel", gender: "female", ownershipPct: 100 }],
    business_description: "Enterprise services supplier with verified procurement documentation.",
    cert_type: "digital",
  });
  setSessionPaid(sessionId, true);
  setSessionCompany(sessionId, "company-ready", {
    id: "company-ready",
    companyName: "Certification Ready LLC",
    aliases: [],
    websiteUrl: "",
    jurisdiction: "United States",
    registrySnippet: "",
    primaryOwner: "Asha Patel",
    ownershipFemalePct: 100,
    directors: [],
    riskFlags: [],
  });
  upsertSessionAiDocumentAssessment(sessionId, {
    submittedCount: 2,
    verified: true,
    confidence: 92,
    summary: "Documents match registration.",
    checkedAt: new Date().toISOString(),
  });
  setSessionVisionChecks(sessionId, { idPassed: true, idConfidence: 94 });
  patchDomainState(sessionId, {
    certificationType: "digital",
    certificationStage: "digital_verification",
    payment: { state: "hold_placed", amountUsd: 100, holdAt: new Date().toISOString() },
  });
  return session;
}

describe("verificationReadiness", () => {
  it("allows supplier-admin approval to begin anchoring from digital review", () => {
    const session = readyDigitalSession();
    setSessionStage(session.id, "voice_attestation");

    const readiness = verificationReadiness(session);

    expect(readiness.isReady).toBe(true);
    expect(readiness.blockers).not.toContain("stage_not_anchoring");
  });
});

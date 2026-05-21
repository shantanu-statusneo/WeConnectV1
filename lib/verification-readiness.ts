import { emptyRegistrationDraft, validateRegistration } from "./registration";
import type { SessionRecord } from "./session-store";
import { getDomainState } from "./store/domain-store";

export function verificationReadiness(session: SessionRecord) {
  const workflow = getDomainState(session.id);
  const isDigital = workflow.certificationType === "digital";
  const requiresIdentity =
    workflow.certificationType === "digital" ||
    session.registration?.cert_type === "digital";
  const paid = session.paid ?? false;
  const reg = validateRegistration(session.registration ?? emptyRegistrationDraft(), isDigital ? paid : true);
  const blockers = [...reg.missingRequired];
  if (!session.companyId) blockers.push("company");
  if (!session.aiAssessmentReport?.documents?.submittedCount) blockers.push("documents");
  if (session.aiAssessmentReport?.documents && !session.aiAssessmentReport.documents.verified) {
    blockers.push("documents_review");
  }
  const identityPassed =
    Boolean(session.visionChecks?.idPassed) ||
    Boolean(session.aiAssessmentReport?.identity?.idFaceMatch) ||
    session.stage === "voice_attestation";
  if (requiresIdentity && !identityPassed) blockers.push("vision_id");
  return {
    isReady: blockers.length === 0,
    blockers,
    ownershipTotal: reg.ownershipTotal,
    paid,
  };
}

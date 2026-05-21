import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { RegistrationDraft } from "@/lib/registration";
import type { ComplianceResult, TrustReport } from "@/lib/domains/contracts";
import { parseJsonSafe } from "./utils";
import { Match, AiAssessmentReport, WorkflowState } from "./types";
import { readSellerSessionId, writeSellerSessionId } from "@/components/auth/session";

const SELLER_SESSION_CACHE_KEY = "weconnect.seller.session.v1";

type PersistedSellerSession = {
  sessionId: string;
  registration: RegistrationDraft;
  paid: boolean;
  stage: string;
  updatedAt: string;
};

function readPersistedSellerSession(sessionId?: string | null): PersistedSellerSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SELLER_SESSION_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedSellerSession;
    if (!parsed?.sessionId || !parsed.registration) return null;
    if (sessionId && parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    window.localStorage.removeItem(SELLER_SESSION_CACHE_KEY);
    return null;
  }
}

function writePersistedSellerSession(
  sessionId: string,
  registration: RegistrationDraft,
  paid: boolean,
  stage: string,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SELLER_SESSION_CACHE_KEY,
    JSON.stringify({
      sessionId,
      registration,
      paid,
      stage,
      updatedAt: new Date().toISOString(),
    } satisfies PersistedSellerSession),
  );
}

function resolveResumeStage(input: {
  stage?: string;
  aiAssessmentReport?: AiAssessmentReport;
  visionChecks?: { idPassed?: boolean };
}) {
  const documentsVerified = Boolean(input.aiAssessmentReport?.documents?.verified);
  const identityVerified =
    Boolean(input.visionChecks?.idPassed) ||
    Boolean(input.aiAssessmentReport?.identity?.idFaceMatch) ||
    input.stage === "voice_attestation";
  if (documentsVerified && identityVerified) return "voice_attestation";
  return input.stage;
}

export function useConciergeSession(
  match: Match | null,
  registration: RegistrationDraft,
  setRegistration: Dispatch<SetStateAction<RegistrationDraft>>,
  paid: boolean,
  setPaid: (v: boolean) => void,
  stage: string,
  setStage: (v: string) => void,
  setAssistant: (v: string) => void,
  visionChecks: { idPassed?: boolean },
  setVisionChecks: Dispatch<SetStateAction<{ idPassed?: boolean }>>,
  setAiAssessmentReport: (v: AiAssessmentReport | null) => void,
  setWorkflow: (v: WorkflowState | null) => void,
  setCompliance: (v: ComplianceResult | null) => void,
  setTrustReport: (v: TrustReport | null) => void,
  setQuestionnaireAnswers: Dispatch<SetStateAction<Record<string, string>>>,
) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const lastAutosavedSessionIdRef = useRef<string | null>(null);
  const lastAutosavedPayloadRef = useRef<string>("");

  const refreshSession = useCallback(async (sid: string) => {
    const r = await fetch(`/api/session?id=${sid}`);
    if (!r.ok) {
      if (r.status === 404) {
        const restore = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
        if (restore.ok) {
          const company = match?.id ? {
            id: match.id,
            companyName: match.companyName,
            jurisdiction: match.jurisdiction,
            registrySnippet: match.registrySnippet,
            primaryOwner: match.primaryOwner,
            ownershipFemalePct: match.ownershipFemalePct ?? 0,
          } : undefined;
          
          await fetch("/api/session/registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, registration, paid, company }),
          });
          const restoredStage = resolveResumeStage({ stage });
          await fetch("/api/session", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, stage: restoredStage }),
          });
          setAssistant("Recovered your session after a server reset. Continuing verification.");
          return;
        }
        setPollingEnabled(false);
        setAssistant("Session expired or reset. Please refresh to start a new verification session.");
      }
      return;
    }
    const j = (await r.json()) as {
      terminalLines?: string[];
      stage?: string;
      registration?: RegistrationDraft;
      paid?: boolean;
      visionChecks?: { idPassed?: boolean };
      aiAssessmentReport?: AiAssessmentReport;
      workflow?: WorkflowState;
    };
    const resumeStage = resolveResumeStage(j);
    if (resumeStage && resumeStage !== stage) setStage(resumeStage);
    if (j.registration) {
      const workflowCertType = j.workflow?.certificationType;
      const selectedCertType =
        workflowCertType === "self" || workflowCertType === "digital"
          ? workflowCertType
          : registration.cert_type === "self" || registration.cert_type === "digital"
            ? registration.cert_type
            : "";
      const serverRegistrationWithCert =
        !j.registration.cert_type && selectedCertType
          ? { ...j.registration, cert_type: selectedCertType }
          : j.registration;
      if (JSON.stringify(serverRegistrationWithCert) !== JSON.stringify(registration)) {
        setRegistration(serverRegistrationWithCert);
      }
      writePersistedSellerSession(sid, serverRegistrationWithCert, Boolean(j.paid), resumeStage ?? stage);
    } else {
      const persisted = readPersistedSellerSession(sid);
      if (persisted?.registration.business_name.trim()) {
        setRegistration(persisted.registration);
        setPaid(persisted.paid);
        const persistedStage = resolveResumeStage({ stage: persisted.stage });
        if (persistedStage && persistedStage !== stage) setStage(persistedStage);
        await fetch("/api/session/registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            registration: persisted.registration,
            paid: persisted.paid,
          }),
        });
        setAssistant("Restored your saved demo registration from this browser.");
        return;
      }
    }
    const nextPaid = Boolean(j.paid);
    if (nextPaid !== paid) setPaid(nextPaid);
    if (j.visionChecks && j.visionChecks.idPassed !== visionChecks.idPassed) {
      setVisionChecks(j.visionChecks);
    }
    if (j.aiAssessmentReport) {
      setAiAssessmentReport(j.aiAssessmentReport);
    } else {
      setAiAssessmentReport(null);
    }
    if (j.workflow) {
      setWorkflow(j.workflow);
      setCompliance(j.workflow.compliance ?? null);
      setTrustReport(j.workflow.trustReport ?? null);
      setQuestionnaireAnswers((prev) => ({ ...prev, ...(j.workflow?.questionnaireAnswers ?? {}) }));
    }
  }, [
    stage,
    registration,
    paid,
    visionChecks.idPassed,
    match,
    setAiAssessmentReport,
    setAssistant,
    setCompliance,
    setPaid,
    setQuestionnaireAnswers,
    setRegistration,
    setStage,
    setTrustReport,
    setVisionChecks,
    setWorkflow,
  ]);

  const saveRegistration = useCallback(async (nextRegistration: RegistrationDraft, nextPaid: boolean) => {
    if (!sessionId) return;
    const company = match?.id ? {
      id: match.id,
      companyName: match.companyName,
      jurisdiction: match.jurisdiction,
      registrySnippet: match.registrySnippet,
      primaryOwner: match.primaryOwner,
      ownershipFemalePct: match.ownershipFemalePct ?? 0,
    } : undefined;
    
    await fetch("/api/session/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        registration: nextRegistration,
        paid: nextPaid,
        company,
      }),
    });
    writePersistedSellerSession(sessionId, nextRegistration, nextPaid, stage);
  }, [sessionId, match, stage]);

  useEffect(() => {
    void (async () => {
      const persisted = readPersistedSellerSession();
      const preferredSessionId = readSellerSessionId() ?? persisted?.sessionId;
      if (persisted?.registration.business_name.trim()) {
        setRegistration(persisted.registration);
        setPaid(persisted.paid);
        const persistedStage = resolveResumeStage({ stage: persisted.stage });
        if (persistedStage) setStage(persistedStage);
      }
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: preferredSessionId ? JSON.stringify({ sessionId: preferredSessionId }) : undefined,
      });
      const parsed = await parseJsonSafe<{ sessionId: string }>(r);
      if (parsed.ok && parsed.data?.sessionId) {
        setPollingEnabled(true);
        setSessionId(parsed.data.sessionId);
        writeSellerSessionId(parsed.data.sessionId);
        if (persisted?.registration.business_name.trim()) {
          await fetch("/api/session/registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: parsed.data.sessionId,
              registration: persisted.registration,
              paid: persisted.paid,
            }),
          });
        }
      }
    })();
  }, [setPaid, setRegistration, setStage]);

  useEffect(() => {
    if (!sessionId || !pollingEnabled) return;
    const t = setInterval(() => void refreshSession(sessionId), 2500);
    return () => clearInterval(t);
  }, [sessionId, pollingEnabled, refreshSession]);

  useEffect(() => {
    if (!sessionId) return;
    const payload = JSON.stringify({ registration, paid });
    if (
      lastAutosavedSessionIdRef.current === sessionId &&
      lastAutosavedPayloadRef.current === payload
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void saveRegistration(registration, paid).then(() => {
        lastAutosavedSessionIdRef.current = sessionId;
        lastAutosavedPayloadRef.current = payload;
      });
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [sessionId, registration, paid, saveRegistration]);

  useEffect(() => {
    if (!sessionId || !registration.business_name.trim()) return;
    writePersistedSellerSession(sessionId, registration, paid, stage);
  }, [sessionId, registration, paid, stage]);

  return { sessionId, saveRegistration, refreshSession, pollingEnabled, setPollingEnabled };
}

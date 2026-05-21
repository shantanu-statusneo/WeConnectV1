import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { parseJsonSafe, fetchWithRetry } from "./utils";
import { GeminiFallbackReason, GeminiQuotaSubtype } from "./types";
import type { DocumentChecklist } from "@/lib/document-requirements";
import { getMissingRequiredDocumentIds } from "@/lib/document-requirements";

export type VerificationProgressStep = {
  label: string;
  status: "pending" | "running" | "done";
};

export type SelectedDocument = {
  requirementId: string;
  requirementLabel: string;
  file: File;
};

const DOCUMENT_PROGRESS_LABELS = [
  "Document uploaded to secure review queue",
  "Reading document text and layout",
  "Fetching business name, owner names, and registration number",
  "Checking registration validity and issue details",
  "Comparing document fields with your application",
  "Preparing document verification decision",
];

const VIDEO_PROGRESS_LABELS = [
  "ID video clip uploaded",
  "Checking video clarity and frame coverage",
  "Reading visible name details from ID",
  "Running face and liveness consistency checks",
  "Comparing ID name with owner record",
  "Preparing identity verification decision",
];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function initialProgress(labels: string[]): VerificationProgressStep[] {
  return labels.map((label) => ({ label, status: "pending" }));
}

export function useVerification(
  sessionId: string | null,
  setAssistant: (v: string) => void,
  speakWithLanguage: (v: string) => void,
  setBadge: (v: string | null) => void,
  refreshSession: (sid: string) => Promise<void>,
  setStage: (v: string) => void,
  setVisionIdPassed: (passed: boolean) => void,
  isSelfPath: boolean,
  runCompliance: () => Promise<void>,
  createTrustReport: () => Promise<void>,
) {
  const [scanning, setScanning] = useState(false);
  const [visionNote, setVisionNote] = useState("");
  const [visionWarning, setVisionWarning] = useState("");
  const [visionBlockers, setVisionBlockers] = useState<string[]>([]);
  const [isVerifyingDocs, setIsVerifyingDocs] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [documentProgress, setDocumentProgress] = useState<VerificationProgressStep[]>([]);
  const [videoProgress, setVideoProgress] = useState<VerificationProgressStep[]>([]);

  const runProgressSteps = useCallback(
    async (
      labels: string[],
      setProgress: Dispatch<SetStateAction<VerificationProgressStep[]>>,
      intervalMs = 3000,
    ) => {
      setProgress(initialProgress(labels));
      for (let i = 0; i < labels.length; i += 1) {
        setProgress((steps) =>
          steps.map((step, idx) => ({
            ...step,
            status: idx < i ? "done" : idx === i ? "running" : "pending",
          })),
        );
        await wait(intervalMs);
      }
      setProgress((steps) => steps.map((step) => ({ ...step, status: "done" })));
    },
    [],
  );

  const sendVision = useCallback(async (dataUrl: string) => {
    if (!sessionId) return;
    setScanning(true);
    setVisionNote("");
    setVideoProgress([]);
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/i);
    const mimeType = mimeMatch?.[1] || "video/webm";
    const progressPromise = runProgressSteps(VIDEO_PROGRESS_LABELS, setVideoProgress, 2000);
    const r = await fetchWithRetry("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, videoBase64: dataUrl, mimeType, task: "id" }),
    });
    await progressPromise;
    const parsed = await parseJsonSafe<{
      result?: Record<string, unknown>;
      stage?: string;
      confidence?: number;
      blockers?: string[];
      visionNameMatchBypassed?: boolean;
      warningCode?: string;
      quotaFallback?: boolean;
      fallbackReason?: GeminiFallbackReason;
      fallbackSubtype?: GeminiQuotaSubtype;
      suggestedNextStage?: string;
    }>(r);
    setScanning(false);
    if (!parsed.ok || !parsed.data) {
      setAssistant(parsed.errorMessage ?? "Vision request failed.");
      await refreshSession(sessionId);
      return;
    }
    const j = parsed.data;
    // Handle quota fallback notice logic would need to be passed up or managed here
    await refreshSession(sessionId);
    if (j.stage) setStage(j.stage);
    const visionPassed = j.stage === "voice_attestation" || j.suggestedNextStage === "voice_attestation";
    if (visionPassed) {
      setVisionIdPassed(true);
      setVisionBlockers([]);
    } else {
      setVisionIdPassed(false);
      setVisionBlockers(j.blockers ?? []);
    }
    if (j.visionNameMatchBypassed) {
      setVisionWarning("Owner identity was not available from source; verification continued with warning.");
    } else {
      setVisionWarning("");
    }
    const conf = Number(j.confidence ?? 0);
    setBadge(
      j.result?.matchesPrimaryOwner || j.visionNameMatchBypassed
        ? `ID VIDEO VERIFIED · pass (conf ${conf})`
        : `ID VIDEO REVIEW · manual review suggested (conf ${conf})`,
    );
    if (visionPassed) {
      setVisionNote("ID video verified. Ownership remains prefill-derived and not vision-verified.");
      if (isSelfPath) {
        await runCompliance();
        await createTrustReport();
      }
      const prompt = isSelfPath
        ? "ID verification complete. Go for the digital certification to get a blockchain-anchored certificate and increase buyer trust and discovery."
        : "ID verification complete. Please enter payment details to submit your Digital Certification request.";
      setAssistant(prompt);
      speakWithLanguage(prompt);
    }
    return j;
  }, [sessionId, setAssistant, speakWithLanguage, setBadge, refreshSession, setStage, setVisionIdPassed, runProgressSteps, isSelfPath, runCompliance, createTrustReport]);

  const verifyDocuments = useCallback(async (documentsToVerify: SelectedDocument[], checklist: DocumentChecklist) => {
    if (!sessionId || !documentsToVerify.length) return;
    const missingRequiredIds = getMissingRequiredDocumentIds(
      checklist,
      documentsToVerify.map((entry) => entry.requirementId),
    );
    if (missingRequiredIds.length) {
      const missingLabels = checklist.requirements
        .filter((requirement) => missingRequiredIds.includes(requirement.id))
        .map((requirement) => requirement.label)
        .join(", ");
      const message = `Please upload required documents before verification: ${missingLabels}.`;
      setDocumentError(message);
      setAssistant(message);
      speakWithLanguage(message);
      return;
    }
    setIsVerifyingDocs(true);
    setDocumentError("");
    setDocumentProgress([]);
    try {
      const documents = await Promise.all(
        documentsToVerify.map(async (entry) => {
          return new Promise<{ base64: string; mimeType: string; requirementId: string; requirementLabel: string; fileName: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const base64 = dataUrl.split(",")[1];
              resolve({
                base64,
                mimeType: entry.file.type,
                requirementId: entry.requirementId,
                requirementLabel: entry.requirementLabel,
                fileName: entry.file.name,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(entry.file);
          });
        })
      );

      const progressPromise = runProgressSteps(DOCUMENT_PROGRESS_LABELS, setDocumentProgress, 2000);
      const res = await fetchWithRetry("/api/document-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          documents,
          checklist: {
            countryGroup: checklist.countryGroup,
            certificationPath: checklist.path,
            requiredDocumentIds: checklist.requirements
              .filter((requirement) => requirement.requiredFor.includes(checklist.path))
              .map((requirement) => requirement.id),
          },
        }),
      });
      await progressPromise;

      const { ok, data } = await parseJsonSafe<{
        result: {
          verified: boolean;
          confidence: number;
          report: string;
          mismatchReasons?: string[];
          matchedSignals?: string[];
        };
      }>(res);
      if (ok && data?.result) {
        if (data.result.verified) {
          setDocumentError("");
          const signalText = data.result.matchedSignals?.length
            ? ` Matched: ${data.result.matchedSignals.join(", ")}.`
            : "";
          const nextStage = checklist.path === "digital" ? "vision_id" : "self_verified";
          const message = checklist.path === "digital"
            ? `Digital Certification documents verified.${signalText} Please show a valid ID in the webcam to continue.`
            : `Self verification complete.${signalText} You uploaded the required Incorporation / business registration document. Digital Certification is highly recommended for stronger buyer trust.`;
          setStage(nextStage);
          setAssistant(message);
          speakWithLanguage(message);
          if (checklist.path === "self") {
            await runCompliance();
            await createTrustReport();
          }
          await fetch("/api/session", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, stage: nextStage }),
          });
          await refreshSession(sessionId);
        } else {
          const reasons = data.result.mismatchReasons?.length
            ? data.result.mismatchReasons.join(" ")
            : data.result.report;
          const message = `Document mismatch detected. ${reasons} Please upload a document for the registered seller.`;
          setDocumentError(message);
          setAssistant(message);
          speakWithLanguage(message);
        }
      } else {
        setDocumentError("Failed to verify documents dynamically.");
        alert("Failed to verify documents dynamically.");
      }
    } catch (err) {
      console.warn("Document submission error:", err);
      setDocumentError("Verification network error. Please try the upload again.");
      alert("Verification network error.");
    } finally {
      setIsVerifyingDocs(false);
    }
  }, [sessionId, setAssistant, speakWithLanguage, setStage, refreshSession, runProgressSteps, runCompliance, createTrustReport]);

  const updateSelectedDocuments = useCallback((files: SelectedDocument[]) => {
    setDocumentError("");
    setSelectedDocuments(files);
  }, []);

  const handleFileUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    requirement: { id: string; label: string },
    checklist: DocumentChecklist,
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const file = files[0];
    const next = [
      ...selectedDocuments.filter((entry) => entry.requirementId !== requirement.id),
      {
        requirementId: requirement.id,
        requirementLabel: requirement.label,
        file,
      },
    ];
    setSelectedDocuments(next);
    await verifyDocuments(next, checklist);
  }, [selectedDocuments, verifyDocuments]);

  return {
    scanning,
    visionNote,
    visionWarning,
    visionBlockers,
    isVerifyingDocs,
    documentError,
    documentProgress,
    videoProgress,
    selectedDocuments, setSelectedDocuments: updateSelectedDocuments,
    sendVision,
    handleFileUpload,
  };
}

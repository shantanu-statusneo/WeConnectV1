import { VoiceConcierge } from "../VoiceConcierge";
import { WebcamCapture } from "../WebcamCapture";
import type { SelectedDocument, VerificationProgressStep } from "./useVerification";
import type { DocumentChecklist, DocumentRequirement } from "@/lib/document-requirements";
import { getMissingRequiredDocumentIds } from "@/lib/document-requirements";
import { AlertTriangle, CheckCircle2, FileUp, ShieldCheck, UploadCloud, XCircle } from "lucide-react";

type VerificationDisplayProps = {
  show: boolean;
  stage: string;
  stepNumber?: 2 | 3;
  certificationMode?: "self" | "digital";
  assistant: string;
  badge: string | null;
  visionNote: string;
  visionWarning: string;
  visionBlockers: string[];
  sessionId: string | null;
  match: unknown;
  onVoice: (text: string) => void;
  documentChecklist: DocumentChecklist;
  selectedDocuments: SelectedDocument[];
  setSelectedDocuments: (v: SelectedDocument[]) => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    requirement: { id: string; label: string },
    checklist: DocumentChecklist,
  ) => void;
  isVerifyingDocs: boolean;
  documentError: string;
  documentProgress: VerificationProgressStep[];
  videoProgress: VerificationProgressStep[];
  scanning: boolean;
  sendVision: (dataUrl: string) => void;
};

function ProgressTimeline({ steps }: { steps: VerificationProgressStep[] }) {
  if (!steps.length) return null;

  return (
    <div className="mt-5 w-full max-w-md rounded-lg border border-cyan-100 bg-white/80 p-4 text-left shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Backend verification activity</p>
      <ol className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                step.status === "done"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                  : step.status === "running"
                    ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                    : "border-slate-200 bg-slate-50 text-slate-300"
              }`}
            >
              {step.status === "done" ? "✓" : step.status === "running" ? "•" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${step.status === "pending" ? "text-slate-400" : "text-slate-700"}`}>
                {step.label}
              </p>
              {step.status === "running" && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-cyan-50">
                  <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-cyan-400" />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function requirementTone(
  requirement: DocumentRequirement,
  checklist: DocumentChecklist,
  selectedDocuments: SelectedDocument[],
) {
  const uploaded = selectedDocuments.some((entry) => entry.requirementId === requirement.id);
  const required = requirement.requiredFor.includes(checklist.path);
  if (uploaded) return "border-emerald-200 bg-emerald-50";
  if (required) return "border-cyan-200 bg-white";
  return "border-slate-200 bg-slate-50/80";
}

function humanizeBlocker(blocker: string) {
  const labels: Record<string, string> = {
    vision_id: "Webcam ID verification",
    country_confirmation: "Country confirmation",
    paid: "Payment",
  };
  return labels[blocker] ?? blocker.replaceAll("_", " ");
}

export function VerificationDisplay({
  show,
  stage,
  stepNumber = 2,
  certificationMode = "self",
  assistant,
  badge,
  visionNote,
  visionWarning,
  visionBlockers,
  sessionId,
  match,
  onVoice,
  documentChecklist,
  selectedDocuments,
  setSelectedDocuments,
  handleFileUpload,
  isVerifyingDocs,
  documentError,
  documentProgress,
  videoProgress,
  scanning,
  sendVision,
}: VerificationDisplayProps) {
  if (!show) return null;
  const isDigitalMode = certificationMode === "digital";
  const visibleRequirements = isDigitalMode
    ? documentChecklist.requirements
    : documentChecklist.requirements.filter((requirement) => requirement.requiredFor.includes("self"));
  const missingRequiredIds = getMissingRequiredDocumentIds(
    documentChecklist,
    selectedDocuments.map((entry) => entry.requirementId),
  );
  const requiredCount = visibleRequirements.filter((requirement) =>
    requirement.requiredFor.includes(documentChecklist.path),
  ).length;
  const uploadedRequiredCount = requiredCount - missingRequiredIds.length;
  const countryLabel =
    documentChecklist.countryGroup === "us"
      ? "United States checklist"
      : documentChecklist.countryGroup === "africa"
        ? "Africa checklist"
        : "Global checklist";

  return (
    <section className="rounded-lg border border-white/40 bg-white/80 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
          {stage === "doc_upload"
            ? `Step ${stepNumber}: Upload ${isDigitalMode ? "Digital Certification" : "Self Verification"} Documents`
            : stage === "vision_id"
              ? `Step ${stepNumber}: Webcam ID Verification`
              : stage === "voice_attestation"
                ? `Step ${stepNumber}: ${isDigitalMode ? "Digital Certification Verification Complete" : "Self Verification Complete"}`
                : stage === "self_verified"
                  ? "Step 2: Self Verification Complete"
                  : `Step ${stepNumber}: ${isDigitalMode ? "Digital Certification" : "Self Verification"}`}
        </h2>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
          Stage: {stage}
        </div>
      </div>
      
      <div className="mt-5 space-y-3">
        <p className="rounded-lg bg-cyan-50/50 p-4 text-sm leading-relaxed text-slate-700 shadow-inner">
          {assistant || "Awaiting input..."}
        </p>
        
        {badge && (
          <div className="flex items-center gap-2 rounded-lg border border-cyan-100 bg-white/50 px-3 py-2 font-mono text-[11px] text-cyan-700 shadow-sm">
            <span className="font-bold opacity-40">SYSTEM:</span> {badge}
          </div>
        )}
        
        {visionNote && (
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            Vision: {visionNote}
          </p>
        )}
        
        {visionWarning && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs font-medium text-amber-700">
            <AlertTriangle size={14} /> {visionWarning}
          </div>
        )}
        
        {!!visionBlockers.length && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-xs font-medium text-rose-700">
            <XCircle size={14} /> Needs attention: {visionBlockers.map(humanizeBlocker).join(", ")}
          </div>
        )}
      </div>

      {stage !== "doc_upload" && stage !== "vision_id" && stage !== "voice_attestation" && stage !== "self_verified" && (
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <VoiceConcierge
            onTranscript={(t) => void onVoice(t)}
            disabled={!sessionId || !match || stage === "complete"}
          />
          <div className="flex-1">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/5 placeholder:text-slate-400"
              placeholder="Type instead of speaking..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  if (val.trim()) {
                    onVoice(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      {stage === "doc_upload" && (
        <div className="mt-8 rounded-lg border border-cyan-100 bg-cyan-50/30 p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-cyan-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-lg bg-cyan-100 p-3 text-cyan-600">
                <UploadCloud size={24} />
              </div>
              <p className="text-base font-semibold text-cyan-900">Upload Document Checklist</p>
              <p className="mt-1 text-xs text-slate-500">
                {countryLabel} · {documentChecklist.path === "digital" ? "digital certification" : documentChecklist.path === "self" ? "self verification" : "registration"} path
              </p>
            </div>
            <div className="rounded-lg border border-cyan-100 bg-white px-3 py-2 text-left shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required ready</p>
              <p className="text-sm font-bold text-slate-800">{uploadedRequiredCount}/{requiredCount}</p>
            </div>
          </div>

          {documentError && (
            <div
              role="alert"
              className="mt-5 flex w-full items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-left text-xs font-medium text-rose-800 shadow-sm"
            >
              <XCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Document mismatch error</p>
                <p className="mt-1 leading-relaxed">{documentError}</p>
              </div>
            </div>
          )}
          
          <div className="mt-5 grid gap-3">
            {visibleRequirements.map((requirement) => {
              const uploaded = selectedDocuments.find((entry) => entry.requirementId === requirement.id);
              const required = requirement.requiredFor.includes(documentChecklist.path);
              return (
                <div
                  key={requirement.id}
                  className={`rounded-lg border p-3 text-left shadow-sm ${requirementTone(requirement, documentChecklist, selectedDocuments)}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {uploaded ? (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        ) : (
                          <FileUp size={15} className={required ? "text-cyan-600" : "text-slate-400"} />
                        )}
                        <p className="text-sm font-bold text-slate-800">{requirement.label}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          required ? "bg-cyan-100 text-cyan-700" : "bg-slate-200 text-slate-500"
                        }`}>
                          {required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{requirement.description}</p>
                      {uploaded && (
                        <p className="mt-2 truncate text-[11px] font-semibold text-emerald-700">{uploaded.file.name}</p>
                      )}
                    </div>
                    <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 text-xs font-bold text-cyan-700 shadow-sm transition-colors hover:bg-cyan-50">
                      <UploadCloud size={14} /> <span>{uploaded ? "Replace" : "Upload"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        disabled={isVerifyingDocs}
                        onChange={(event) => handleFileUpload(event, { id: requirement.id, label: requirement.label }, documentChecklist)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {!!selectedDocuments.length && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocuments([])}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                disabled={isVerifyingDocs}
              >
                Clear All
              </button>
            </div>
          )}
          
          {isVerifyingDocs ? (
            <>
              <div className="mt-5 inline-flex items-center gap-3 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-200">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                VERIFYING DOCUMENT CHECKLIST...
              </div>
              <ProgressTimeline steps={documentProgress} />
            </>
          ) : null}
        </div>
      )}

      {stage === "vision_id" && (
        <div className="mt-6">
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Show a valid ID in the webcam</p>
            <p className="mt-1 text-xs text-emerald-700">
              The scan checks liveness, clarity, and visible identity signals before {isDigitalMode ? "payment details are collected" : "certificate issuance"}.
            </p>
          </div>
          <WebcamCapture
            scanning={scanning}
            label="Record ID clip (2s)"
            onCapture={(dataUrl) => sendVision(dataUrl)}
          />
          <ProgressTimeline steps={videoProgress} />
        </div>
      )}

      {stage === "voice_attestation" && (
        <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={17} /> {isDigitalMode ? "Digital documents and webcam ID are complete." : "Self verification is complete."}
          </p>
          <p className="mt-1 text-xs text-emerald-700">{isDigitalMode ? "Continue below to payment details." : "Continue below to paid Digital Certification"}</p>
        </div>
      )}
    </section>
  );
}

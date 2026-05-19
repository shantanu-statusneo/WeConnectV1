import { VoiceConcierge } from "../VoiceConcierge";
import { WebcamCapture } from "../WebcamCapture";
import type { VerificationProgressStep } from "./useVerification";
import { AlertTriangle, CheckCircle2, FileUp, ShieldCheck, UploadCloud, XCircle } from "lucide-react";

type VerificationDisplayProps = {
  show: boolean;
  stage: string;
  assistant: string;
  badge: string | null;
  visionNote: string;
  visionWarning: string;
  visionBlockers: string[];
  sessionId: string | null;
  match: unknown;
  onVoice: (text: string) => void;
  selectedDocuments: File[];
  setSelectedDocuments: (v: File[]) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

export function VerificationDisplay({
  show,
  stage,
  assistant,
  badge,
  visionNote,
  visionWarning,
  visionBlockers,
  sessionId,
  match,
  onVoice,
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

  return (
    <section className="rounded-lg border border-white/40 bg-white/80 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
          {stage === "doc_upload"
            ? "Step 2: Upload Supporting Documents"
            : stage === "vision_id"
              ? "Step 2: Webcam ID Verification"
              : stage === "voice_attestation"
                ? "Step 2: Self Verification Complete"
                : "Step 2: Self Verification"}
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
            <XCircle size={14} /> Blockers: {visionBlockers.join(", ")}
          </div>
        )}
      </div>

      {stage !== "doc_upload" && stage !== "vision_id" && stage !== "voice_attestation" && (
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
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/30 p-8 text-center transition-colors hover:bg-cyan-50/50">
          <div className="mb-3 rounded-lg bg-cyan-100 p-3 text-cyan-600">
            <UploadCloud size={24} />
          </div>
          <p className="text-base font-semibold text-cyan-900">Upload Supporting Documents</p>
          <p className="mt-1 text-xs text-slate-500">Business registration, tax, ownership, or incorporation documents. PDF/DOCX, max 3 files.</p>

          {documentError && (
            <div
              role="alert"
              className="mt-5 flex w-full max-w-md items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-left text-xs font-medium text-rose-800 shadow-sm"
            >
              <XCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Document mismatch error</p>
                <p className="mt-1 leading-relaxed">{documentError}</p>
              </div>
            </div>
          )}
          
          {!!selectedDocuments.length && (
            <div className="mt-6 w-full max-w-md divide-y divide-cyan-100 rounded-lg border border-cyan-100 bg-white p-2 shadow-sm">
              <div className="flex flex-col gap-2 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected files ({selectedDocuments.length}/3)</p>
                <ul className="space-y-1.5">
                  {selectedDocuments.map((file) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 truncate text-[11px] font-medium text-slate-600">
                      <FileUp size={12} className="shrink-0 text-cyan-500" />
                      {file.name}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSelectedDocuments([])}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                  disabled={isVerifyingDocs}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          
          {isVerifyingDocs ? (
            <>
              <div className="mt-5 flex items-center gap-3 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-200">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                VERIFYING DOCUMENT...
              </div>
              <ProgressTimeline steps={documentProgress} />
            </>
          ) : (
            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200 transition-all hover:-translate-y-0.5 hover:shadow-cyan-300 active:translate-y-0 active:scale-95">
              <UploadCloud size={16} /> <span>Select Files</span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
            </label>
          )}
        </div>
      )}

      {stage === "vision_id" && (
        <div className="mt-6">
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="flex items-center gap-2 font-semibold"><ShieldCheck size={16} /> Show a valid ID in the webcam</p>
            <p className="mt-1 text-xs text-emerald-700">The scan checks liveness, clarity, and visible identity signals before certificate issuance.</p>
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
            <CheckCircle2 size={17} /> Documents and webcam ID are complete.
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            The blockchain self-verification certificate can now be generated below.
          </p>
        </div>
      )}
    </section>
  );
}

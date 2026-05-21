import type { Dispatch, SetStateAction } from "react";
import { CertificateCard, type CertDisplay } from "../CertificateCard";
import { RegistrationDraft } from "@/lib/registration";
import { getMissingRequiredDocumentIds, type DocumentChecklist } from "@/lib/document-requirements";
import type { SelectedDocument } from "./useVerification";
import type { AiAssessmentReport } from "./types";
import { ArrowRight, BadgeCheck, Clock3, CreditCard, Download, FileText, RotateCcw, Search, ShieldCheck, Users } from "lucide-react";
import { ChangeEvent } from "react";

type UpgradePortalProps = {
  show: boolean;
  cert: CertDisplay | null;
  verifyUrl: string;
  registration: RegistrationDraft;
  setRegistration: Dispatch<SetStateAction<RegistrationDraft>>;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
  mockCardValid: boolean;
  digitalVerificationComplete: boolean;
  paid: boolean;
  onUpgrade: () => void;
  aiAssessmentReport: AiAssessmentReport | null;
  documentChecklist: DocumentChecklist;
  selectedDocuments: SelectedDocument[];
  documentError: string;
  countryConfirmed: boolean;
  countryRequiresConfirmation: boolean;
  visionWarning: string;
  downloadAiAssessmentReport: () => void;
  downloadingAiReport: boolean;
};

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatCheckedAt(value?: string) {
  if (!value) return "Review timestamp pending";
  return new Date(value).toLocaleString();
}

function buildAssessmentRows({
  report,
  registration,
  documentChecklist,
  selectedDocuments,
  documentError,
  countryConfirmed,
  countryRequiresConfirmation,
  visionWarning,
}: {
  report: AiAssessmentReport | null;
  registration: RegistrationDraft;
  documentChecklist: DocumentChecklist;
  selectedDocuments: SelectedDocument[];
  documentError: string;
  countryConfirmed: boolean;
  countryRequiresConfirmation: boolean;
  visionWarning: string;
}) {
  const documents = report?.documents;
  const identity = report?.identity;
  const requiredIds = documentChecklist.requirements
    .filter((requirement) => requirement.requiredFor.includes(documentChecklist.path))
    .map((requirement) => requirement.id);
  const submittedIds = documents?.submittedRequirementIds ?? [];
  const uploadedIds = selectedDocuments.length ? selectedDocuments.map((entry) => entry.requirementId) : submittedIds;
  const requiredAssessmentIds = documents?.requiredDocumentIds?.length ? documents.requiredDocumentIds : requiredIds;
  const missingIds = getMissingRequiredDocumentIds(documentChecklist, uploadedIds).filter((id) => requiredAssessmentIds.includes(id));
  const missingLabels = documentChecklist.requirements
    .filter((requirement) => missingIds.includes(requirement.id))
    .map((requirement) => requirement.label);
  const requiredComplete = requiredAssessmentIds.length ? requiredAssessmentIds.length - missingIds.length : 0;
  const completeness = requiredAssessmentIds.length ? (requiredComplete / requiredAssessmentIds.length) * 100 : 100;
  const correctness = documents?.confidence ?? (documents?.verified ? 86 : 64);
  const identityConfidence = identity?.matchScore ?? identity?.confidence ?? 0;
  const ownershipProofUploaded = uploadedIds.includes("ownership_proof") || uploadedIds.includes("us_shareholder_ownership_document") || uploadedIds.includes("africa_shareholder_ownership_document");
  const ownershipDeclarationUploaded = uploadedIds.includes("women_ownership_declaration");
  const managementProofUploaded = uploadedIds.includes("hr_role_document");
  const mismatchFlags = [
    documentError,
    visionWarning,
    identity?.warningCode ? `Identity warning: ${identity.warningCode.replaceAll("_", " ")}` : "",
    identity?.nameMatchBypassed ? "Owner name unavailable; identity name match bypassed for review" : "",
  ].filter(Boolean);
  const status = documents?.verified && (identity?.idFaceMatch || identityConfidence >= 80)
    ? "Provisionally Eligible"
    : "Assessor Review Recommended";

  return {
    status,
    highlights: [
      ["Assessment Status", status],
      ["Document Completeness", pct(completeness)],
      ["Document Correctness", pct(correctness)],
      ["Liveness / Identity Confidence", identityConfidence ? pct(identityConfidence) : "Not applicable"],
    ] as Array<[string, string]>,
    rows: [
      ["Document completeness", `${requiredComplete} of ${requiredAssessmentIds.length || 0} required documents received (${pct(completeness)}).`],
      ["Document correctness", documents?.verified ? `Verified with ${pct(correctness)} confidence.` : `Requires review; current confidence is ${pct(correctness)}.`],
      ["Business registry consistency", documents?.verified ? "Document fields are consistent with the supplier registration profile." : documents?.summary ?? "Registry consistency is pending document verification."],
      ["Ownership evidence", ownershipProofUploaded && ownershipDeclarationUploaded ? "Ownership proof and women-ownership declaration are present." : "One item requires assessor review."],
      ["Management / control evidence", managementProofUploaded ? "Management or role evidence received for assessor review." : registration.business_description ? "Operational narrative is present; role evidence remains reviewable." : "Management/control evidence is pending."],
      ["Identity / liveness confidence", identity ? `${identity.idFaceMatch ? "Passed" : "Review"} with ${pct(identityConfidence)} confidence${identity.livenessHint ? `; ${identity.livenessHint}` : ""}.` : "Not applicable yet."],
      ["Country checklist completion", `${requiredComplete} of ${requiredAssessmentIds.length || 0} items complete${countryRequiresConfirmation && !countryConfirmed ? "; country confirmation pending" : ""}.`],
      ["Metadata review", documents?.checkedAt || identity?.checkedAt ? `Last AI check: ${formatCheckedAt(documents?.checkedAt ?? identity?.checkedAt)}.` : "Metadata review pending."],
      ["Pending documents", missingLabels.length ? missingLabels.join(", ") : "No required documents pending."],
      ["Mismatch flags", mismatchFlags.length ? mismatchFlags.join(" ") : "No active mismatch flags."],
      ["Recommended next action", documents?.verified && (identity?.idFaceMatch || identityConfidence >= 80) ? "Generate provisional certificate pending final approval." : "Route to assessor review before provisional certification."],
    ] as Array<[string, string]>,
  };
}

export function UpgradePortal({
  show,
  cert,
  verifyUrl,
  registration,
  setRegistration,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  mockCardValid,
  digitalVerificationComplete,
  paid,
  onUpgrade,
  aiAssessmentReport,
  documentChecklist,
  selectedDocuments,
  documentError,
  countryConfirmed,
  countryRequiresConfirmation,
  visionWarning,
  downloadAiAssessmentReport,
  downloadingAiReport,
}: UpgradePortalProps) {
  if (!show) return null;

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setCardExpiry(value);
  };

  const handleCvvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(value);
  };

  const assessment = buildAssessmentRows({
    report: aiAssessmentReport,
    registration,
    documentChecklist,
    selectedDocuments,
    documentError,
    countryConfirmed,
    countryRequiresConfirmation,
    visionWarning,
  });

  return (
    <section className="rounded-lg border border-white/40 bg-white/80 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-6">
      {cert ? (
        <div className="mb-6 opacity-60 scale-95 origin-top">
          <CertificateCard cert={cert} verifyUrl={verifyUrl || `/verify/${cert.id}`} />
        </div>
      ) : null}

      <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-5 shadow-lg shadow-blue-100">
        <p className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
          <BadgeCheck size={13} /> Buyer-ready upgrade
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-blue-950">Step 3: Digital Certification</h2>
        <p className="mt-2 text-sm leading-6 text-blue-800">
          Complete regional documents, optional proof, webcam ID, and payment to move from self-verified to a stronger buyer-trust profile.
        </p>
        <div className="mt-4 grid gap-2 text-xs font-bold text-blue-900 sm:grid-cols-3">
          <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><Search size={14} /> Stronger buyer search signal</p>
          <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><Users size={14} /> Better RFP shortlist readiness</p>
          <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><ShieldCheck size={14} /> 72-hour trust review</p>
        </div>
      </div>

      {paid ? (
        <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="flex items-center gap-2 font-bold">
            <BadgeCheck size={16} /> Digital certification request submitted
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            A provisional certificate has been issued. If the request is approved, the supplier admin will issue the blockchain-backed certificate; rejected requests are refunded.
          </p>
        </div>
      ) : null}

      {paid ? (
        <div className="mt-5 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-[color:var(--foreground)] shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md bg-[color:var(--card-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[color:var(--brand-plum)]">
                <FileText size={13} /> AI Assessment Report
              </p>
              <h3 className="mt-3 text-xl font-black tracking-tight">Business verification summary</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                This report summarizes the verification state in plain business terms for supplier-admin review.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadAiAssessmentReport}
              disabled={downloadingAiReport}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-4 py-2 text-xs font-bold text-[color:var(--brand-plum)] transition-colors hover:bg-[color:var(--card-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} /> {downloadingAiReport ? "Preparing..." : "Download PDF"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {assessment.highlights.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{label}</p>
                <p className="mt-1 text-sm font-black text-[color:var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          <dl className="mt-4 divide-y divide-[color:var(--border)] text-sm">
            {assessment.rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
                <dt className="text-xs font-black uppercase tracking-wider text-[color:var(--muted)]">{label}</dt>
                <dd className="leading-6 text-[color:var(--muted-strong)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      
      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="email@company.com"
              value={registration.email}
              onChange={(e) => setRegistration((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="+1 (555) 000-0000"
              value={registration.phone}
              onChange={(e) => setRegistration((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </label>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
          <p className="font-bold uppercase tracking-wider text-[10px] mb-2">Process & Refund Policy</p>
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <p className="flex items-center gap-2"><Clock3 size={14} /> 72-hour review SLA</p>
            <p className="flex items-center gap-2"><CreditCard size={14} /> $100 payment hold</p>
            <p className="flex items-center gap-2"><RotateCcw size={14} /> Rejection refund</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Payment Details</p>
          {!digitalVerificationComplete && !paid ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Finish the Digital Certification checklist and webcam ID first. Then payment opens so your profile can move toward stronger buyer visibility.
            </div>
          ) : null}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="Card number"
              value={cardNumber}
              disabled={paid || !digitalVerificationComplete}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="MM/YY"
              value={cardExpiry}
              disabled={paid || !digitalVerificationComplete}
              onChange={handleExpiryChange} // Updated handler
            />

            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="CVV"
              value={cardCvv}
              disabled={paid || !digitalVerificationComplete}
              type="password" // Keeps the input hidden/masked
              onChange={handleCvvChange} // Updated handler
            />
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            disabled={paid || !digitalVerificationComplete || !mockCardValid}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ShieldCheck size={17} /> {paid ? "Request Submitted" : <>Pay $100 & Unlock Buyer Trust <ArrowRight size={17} /></>}
          </button>
        </div>
      </div>
    </section>
  );
}

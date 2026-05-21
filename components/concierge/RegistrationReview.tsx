import type { Dispatch, SetStateAction } from "react";
import { Match, DiscoverJson, OwnershipBreakdown, OwnershipSummary } from "./types";
import { RegistrationDraft } from "@/lib/registration";
import { formatCodeList } from "@/lib/code-labels";
import { CheckCircle2, ExternalLink } from "lucide-react";

type DiscoveryCandidate = NonNullable<DiscoverJson["candidates"]>[number];

type RegistrationReviewProps = {
  show: boolean;
  match: Match | null;
  registration: RegistrationDraft;
  setRegistration: Dispatch<SetStateAction<RegistrationDraft>>;
  fieldConfidence: Partial<Record<keyof RegistrationDraft, number>>;
  fieldEvidence: Partial<Record<keyof RegistrationDraft, string>>;
  countryRequiresConfirmation: boolean;
  countryConfirmed: boolean;
  setCountryConfirmed: (v: boolean) => void;
  ownership: OwnershipSummary | null;
  ownershipEvidenceConfidence: number;
  ownershipBreakdown: OwnershipBreakdown | null;
  needsCandidateConfirmation: boolean;
  discoverCandidates: DiscoveryCandidate[];
  selectedCandidateIndex: number;
  setSelectedCandidateIndex: (v: number) => void;
  onRunDiscover: (index: number, confirmed: boolean) => void;
  founderNames: string[];
  registrationCheck: { missingRequired: string[] };
  mergedBlockers: string[];
  anchorFailureReason: string;
  anchorOperatorHint: string;
  onConfirmRegistration: () => void;
};

function humanizeBlocker(blocker: string) {
  const labels: Record<string, string> = {
    vision_id: "Webcam ID verification",
    country_confirmation: "Country confirmation",
    paid: "Payment",
  };
  return labels[blocker] ?? blocker.replaceAll("_", " ");
}

export function RegistrationReview({
  show,
  match,
  registration,
  setRegistration,
  fieldConfidence,
  fieldEvidence,
  countryRequiresConfirmation,
  countryConfirmed,
  setCountryConfirmed,
  ownership,
  ownershipEvidenceConfidence,
  ownershipBreakdown,
  needsCandidateConfirmation,
  discoverCandidates,
  selectedCandidateIndex,
  setSelectedCandidateIndex,
  onRunDiscover,
  founderNames,
  registrationCheck,
  mergedBlockers,
  anchorFailureReason,
  anchorOperatorHint,
  onConfirmRegistration,
}: RegistrationReviewProps) {
  if (!show || !match) return null;
  const confirmDisabled =
    needsCandidateConfirmation ||
    (countryRequiresConfirmation && !countryConfirmed) ||
    registrationCheck.missingRequired.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-[0_14px_36px_rgb(15,23,42,0.1)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 1: Confirm Seller Registration</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review the organisation details that were prefilled from registry and Google web, then edit anything that needs correction.
          </p>
        </div>
        <button
          type="button"
          onClick={onConfirmRegistration}
          disabled={confirmDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgb(5,150,105,0.25)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CheckCircle2 size={16} /> Confirm Details
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/75 p-4 text-sm">
        <p className="font-semibold text-emerald-800">{match.companyName}</p>
        <p className="text-slate-600">{match.registrySnippet}</p>
        <p className="mt-2 text-slate-700">
          Primary owner: <span className="font-medium text-slate-900">{match.primaryOwner}</span> · Female
          ownership (filed, prefill only):{" "}
          <span className="text-emerald-700">
            {typeof match.ownershipFemalePct === "number" && ownershipEvidenceConfidence > 0
              ? `${match.ownershipFemalePct}%`
              : "Unknown (awaiting evidence)"}
          </span>
        </p>
        <p className="mt-1 text-slate-700">
          Primary owner share (prefill, unverified):{" "}
          <span className="text-amber-700">
            {typeof match.ownerPrefillPct === "number" ? `${match.ownerPrefillPct}%` : "Unknown"}
          </span>
        </p>
        <p className="mt-1 text-slate-700">
          Ownership source:{" "}
          <span className="text-cyan-700">{ownership?.sourceType ?? "web_inferred"}</span> · Confidence:{" "}
          <span className="text-cyan-700">{ownershipEvidenceConfidence}%</span>
          {ownership?.value !== undefined ? (
            <>
              {" "}
              · Reported stake: <span className="text-cyan-700">{ownership.value}%</span>
            </>
          ) : null}
        </p>
        {ownershipBreakdown?.ownership_total_promoter_pct !== undefined ||
          ownershipBreakdown?.ownership_total_public_pct !== undefined ? (
          <p className="mt-1 text-slate-700">
            Promoter/Public:{" "}
            <span className="text-cyan-700">
              {ownershipBreakdown.ownership_total_promoter_pct ?? "NA"}% /{" "}
              {ownershipBreakdown.ownership_total_public_pct ?? "NA"}%
            </span>
            {ownershipBreakdown.exchange && ownershipBreakdown.symbol ? (
              <> · {ownershipBreakdown.exchange}:{ownershipBreakdown.symbol}</>
            ) : null}
          </p>
        ) : null}
        {needsCandidateConfirmation ? (
          <p className="mt-2 text-xs text-amber-700">
            Candidate confirmation required before verification can start.
          </p>
        ) : null}
        {countryRequiresConfirmation && !countryConfirmed ? (
          <p className="mt-2 text-xs text-amber-700">
            Country confirmation required before verification can start.
          </p>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-white/80 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-cyan-100/50 pb-3">
          <div>
            <h3 className="text-base font-semibold text-cyan-900">Prefill Review</h3>
            <p className="text-xs text-cyan-700/70">
              Verify and edit the details fetched from the registry or web.
            </p>
          </div>
          <div className="rounded-lg bg-cyan-100/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
            Editable
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Business name</span>
            <input
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
              value={registration.business_name}
              onChange={(e) =>
                setRegistration((prev) => ({ ...prev, business_name: e.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Country</span>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
                value={registration.country}
                onChange={(e) => {
                  const next = e.target.value;
                  setRegistration((prev) => ({ ...prev, country: next }));
                  if (countryRequiresConfirmation) {
                    setCountryConfirmed(false);
                  }
                }}
              />
              {countryRequiresConfirmation && (
                <button
                  type="button"
                  onClick={() => setCountryConfirmed(Boolean(registration.country.trim()))}
                  className={`absolute right-2 top-1.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                    countryConfirmed 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-cyan-50 text-cyan-600 border border-cyan-100 hover:bg-cyan-100"
                  }`}
                >
                  {countryConfirmed ? "✓ Confirmed" : "Confirm"}
                </button>
              )}
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Primary owner</span>
            <input
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
              value={registration.owner_details[0]?.fullName || ""}
              onChange={(e) =>
                setRegistration((prev) => ({
                  ...prev,
                  owner_details: [
                    {
                      fullName: e.target.value,
                      gender: prev.owner_details[0]?.gender || "Unknown",
                      ownershipPct: prev.owner_details[0]?.ownershipPct ?? 100,
                    },
                  ],
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">NAICS codes</span>
            <input
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="e.g. 541511, 511210"
              value={registration.naics_codes.join(", ")}
              onChange={(e) =>
                setRegistration((prev) => ({
                  ...prev,
                  naics_codes: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                }))
              }
            />
            <span className="text-xs leading-5 text-cyan-900/70">{formatCodeList(registration.naics_codes, "naics", "No NAICS code selected")}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">UNSPSC codes</span>
            <input
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="e.g. 43232304, 43232107"
              value={registration.unspsc_codes.join(", ")}
              onChange={(e) =>
                setRegistration((prev) => ({
                  ...prev,
                  unspsc_codes: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                }))
              }
            />
            <span className="text-xs leading-5 text-cyan-900/70">{formatCodeList(registration.unspsc_codes, "unspsc", "No UNSPSC code selected")}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Female owned %</span>
            <input
              type="number"
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
              value={registration.owner_details[0]?.ownershipPct ?? 0}
              onChange={(e) =>
                setRegistration((prev) => ({
                  ...prev,
                  owner_details: [
                    {
                      fullName: prev.owner_details[0]?.fullName || (match?.primaryOwner ?? ""),
                      gender: prev.owner_details[0]?.gender || "Female",
                      ownershipPct: Number(e.target.value || 0),
                    },
                  ],
                }))
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Company type</span>
            <input
              className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              value={registration.company_type}
              onChange={(e) =>
                setRegistration((prev) => ({ ...prev, company_type: e.target.value }))
              }
              placeholder="e.g. Private Limited, LLP"
            />
          </label>

          {founderNames.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Founders</span>
              <div className="flex flex-wrap gap-2">
                {founderNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-lg border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-800/60">Business description (min 30 chars)</span>
          <textarea
            className="w-full rounded-lg border border-cyan-200/50 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
            rows={3}
            value={registration.business_description}
            onChange={(e) =>
              setRegistration((prev) => ({ ...prev, business_description: e.target.value }))
            }
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-cyan-100/50 pt-4">
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-50/50 px-3 py-1 text-[10px] font-bold text-cyan-700 shadow-sm border border-cyan-100/50">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Name Confidence: {fieldConfidence.business_name ?? 0}%
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-cyan-50/50 px-3 py-1 text-[10px] font-bold text-cyan-700 shadow-sm border border-cyan-100/50">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Country Confidence: {fieldConfidence.country ?? 0}%
          </div>
        </div>

        <div className="mt-3 space-y-1.5 px-1">
          {fieldEvidence.business_name ? <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Evidence (Name): <span className="font-medium normal-case italic text-slate-500">{fieldEvidence.business_name}</span></p> : null}
          {fieldEvidence.country ? <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Evidence (Country): <span className="font-medium normal-case italic text-slate-500">{fieldEvidence.country}</span></p> : null}
        </div>
        
        {!!discoverCandidates.length && (
            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Web Search Candidates</p>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  value={selectedCandidateIndex}
                  onChange={(e) => setSelectedCandidateIndex(Number(e.target.value))}
                >
                  {discoverCandidates.slice(0, 3).map((c, idx) => (
                    <option key={`${c.url}-${idx}`} value={idx}>
                      Candidate #{idx + 1} ({c.score ?? 0})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onRunDiscover(selectedCandidateIndex, true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1 text-[11px] font-bold text-white transition-all hover:bg-cyan-500"
                >
                  USE THIS <ExternalLink size={11} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {discoverCandidates.slice(0, 3).map((c, idx) => (
                <div 
                  key={`${c.url}-${idx}`} 
                  className={`rounded-lg border p-3 transition-all ${idx === selectedCandidateIndex ? "border-cyan-200 bg-white shadow-sm ring-1 ring-cyan-100" : "border-slate-100 bg-white/50 opacity-60"}`}
                >
                  <p className="text-xs font-bold text-slate-800">{c.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{c.snippet}</p>
                  {c.domain && <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-cyan-600">{c.domain}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!!registrationCheck.missingRequired.length && (
          <p className="mt-2 text-xs text-amber-300">
            Missing/unverified: {registrationCheck.missingRequired.join(", ")}
          </p>
        )}
        {!!mergedBlockers.length && (
          <p className="mt-2 text-xs text-amber-400">
            Readiness blockers: {mergedBlockers.map(humanizeBlocker).join(", ")}
          </p>
        )}
        {anchorFailureReason ? (
          <p className="mt-2 text-xs text-rose-300">Anchor response: {anchorFailureReason}</p>
        ) : null}
        {anchorOperatorHint ? (
          <p className="mt-2 text-xs text-amber-300">Anchor action: {anchorOperatorHint}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-cyan-100/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Registration must be complete before document upload and webcam ID verification can start.
          </p>
          <button
            type="button"
            onClick={onConfirmRegistration}
            disabled={confirmDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgb(5,150,105,0.25)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCircle2 size={16} /> Confirm Details
          </button>
        </div>
      </div>
    </section>
  );
}

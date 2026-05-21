"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageSquareMore,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { formatCodeList } from "@/lib/code-labels";

type DigitalRequest = {
  id: string;
  sessionId: string;
  businessName: string;
  country: string;
  email: string;
  phone: string;
  companyType: string;
  employeeRange: string;
  revenueRange: string;
  womenOwned: boolean | null;
  ownerDetails: Array<{ fullName: string; gender: string; ownershipPct: number }>;
  designations: string[];
  additionalCerts: string[];
  paymentState: string;
  paymentAmountUsd: number;
  certificationStage: string;
  verificationStatus: string;
  industryCodes: string[];
  categoryCodes: string[];
  trustScore: number;
  lastVerified?: string;
  businessSummary?: string;
  documentAssessment: {
    submittedCount: number;
    verified: boolean;
    confidence: number;
    summary: string;
    checkedAt: string;
    submittedRequirementIds: string[];
    requiredDocumentIds: string[];
  } | null;
  identityAssessment: {
    idPassed: boolean;
    idConfidence?: number;
  };
  uploadedDocuments: Array<{
    requirementId?: string;
    requirementLabel?: string;
    fileName?: string;
    mimeType?: string;
    uploadedAt: string;
  }>;
  adminNotes: string[];
};

export default function DigitalCertificationRequests() {
  const [items, setItems] = useState<DigitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [infoNotes, setInfoNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/digital-cert-requests");
    const json = (await res.json()) as { requests?: DigitalRequest[] };
    setItems(json.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (requestId: string, action: "approve" | "reject" | "request_info") => {
    setBusyId(requestId);
    setMessage("");
    const res = await fetch("/api/admin/digital-cert-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, reason: infoNotes[requestId]?.trim() }),
    });
    const json = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setMessage(json.error ?? "Could not update digital certification request.");
      return;
    }
    setMessage(
      action === "approve"
        ? "Blockchain-backed certificate issued."
        : action === "reject"
          ? "Request rejected and payment refunded."
          : "Additional information request sent to seller record.",
    );
    if (action === "request_info") {
      setInfoNotes((prev) => ({ ...prev, [requestId]: "" }));
    }
    await load();
  };

  return (
    <section className="enterprise-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
            <BadgeCheck size={15} />Digital certification requests
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Seller registrations waiting for digital certification review.</p>
        </div>
        <Link
          href="/admin/review"
          className="btn-outline gap-1.5 px-3 py-1.5 text-xs"
        >
          Review queue <ExternalLink size={12} />
        </Link>
      </div>

      {loading ? <p className="text-xs text-[color:var(--muted)]">Loading requests...</p> : null}
      {message ? <p className="mb-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-xs text-[color:var(--foreground)]">{message}</p> : null}

      <div className="space-y-2">
        {!loading && items.length === 0 ? (
          <p className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-4 text-sm text-[color:var(--muted)]">
            No pending digital certification requests.
          </p>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-3 transition-colors hover:border-[color:var(--border-strong)] hover:bg-[color:var(--card-muted)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                  <Building2 size={14} className="text-[color:var(--brand-plum)]" />
                  {item.businessName}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {item.country} · NAICS {formatCodeList(item.industryCodes, "naics")} · UNSPSC {formatCodeList(item.categoryCodes, "unspsc")}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{item.businessSummary ?? "No summary supplied."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--card-muted)] px-2.5 py-1">
                    <Mail size={11} /> {item.email || "No email"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--card-muted)] px-2.5 py-1">
                    <Phone size={11} /> {item.phone || "No phone"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--card-muted)] px-2.5 py-1">
                    <UserRound size={11} /> {item.ownerDetails.length ? `${item.ownerDetails.length} owner(s)` : "No owners"}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-[color:var(--foreground)]">{item.trustScore}</p>
                <p className="flex items-center gap-1 text-[10px] text-[color:var(--muted)]">
                  <Clock size={10} />{item.lastVerified ?? "new"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Supplier details</p>
                <dl className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
                  <div className="flex justify-between gap-3"><dt>Company type</dt><dd className="text-right text-[color:var(--foreground)]">{item.companyType || "N/A"}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Employees</dt><dd className="text-right text-[color:var(--foreground)]">{item.employeeRange || "N/A"}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Revenue</dt><dd className="text-right text-[color:var(--foreground)]">{item.revenueRange || "N/A"}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Women owned</dt><dd className="text-right text-[color:var(--foreground)]">{item.womenOwned === null ? "N/A" : item.womenOwned ? "Yes" : "No"}</dd></div>
                </dl>
              </div>

              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Review status</p>
                <dl className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
                  <div className="flex justify-between gap-3"><dt>Payment</dt><dd className="text-right text-[color:var(--foreground)]">{item.paymentState} · ${item.paymentAmountUsd}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Stage</dt><dd className="text-right text-[color:var(--foreground)]">{item.certificationStage}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Verification</dt><dd className="text-right text-[color:var(--foreground)]">{item.verificationStatus}</dd></div>
                  <div className="flex justify-between gap-3"><dt>ID check</dt><dd className="text-right text-[color:var(--foreground)]">{item.identityAssessment.idPassed ? `Passed (${item.identityAssessment.idConfidence ?? "n/a"}%)` : "Pending"}</dd></div>
                </dl>
              </div>

              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Owners</p>
                <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
                  {item.ownerDetails.length ? item.ownerDetails.map((owner) => (
                    <p key={`${owner.fullName}-${owner.ownershipPct}`} className="flex justify-between gap-3">
                      <span className="truncate">{owner.fullName || "Unnamed owner"}</span>
                      <span className="shrink-0 text-[color:var(--foreground)]">{owner.ownershipPct}%</span>
                    </p>
                  )) : <p>No owner details supplied.</p>}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
                <FileText size={13} /> Uploaded documents
              </p>
              {item.uploadedDocuments.length ? (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {item.uploadedDocuments.map((document) => (
                    <div key={`${document.requirementId}-${document.fileName}`} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-2 text-xs">
                      <p className="font-semibold text-[color:var(--foreground)]">{document.requirementLabel || document.requirementId || "Uploaded document"}</p>
                      <p className="mt-0.5 truncate text-[color:var(--muted)]">{document.fileName || "Unnamed file"} · {document.mimeType || "unknown type"}</p>
                      <p className="mt-0.5 text-[10px] text-[color:var(--muted)]">Uploaded {new Date(document.uploadedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[color:var(--muted)]">No uploaded document metadata is available for this session yet.</p>
              )}
              {item.documentAssessment ? (
                <p className="mt-3 rounded-lg bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--muted)]">
                  Document AI: {item.documentAssessment.verified ? "verified" : "needs review"} · confidence {item.documentAssessment.confidence}% · {item.documentAssessment.summary}
                </p>
              ) : null}
            </div>

            <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
              <label className="text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]" htmlFor={`info-${item.id}`}>
                Ask seller for additional info
              </label>
              <textarea
                id={`info-${item.id}`}
                className="textarea-field mt-2 min-h-[72px] text-sm"
                placeholder="Example: Please upload a signed ownership declaration and clarify owner control rights."
                value={infoNotes[item.id] ?? ""}
                onChange={(event) => setInfoNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
              />
              {item.adminNotes.length ? (
                <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
                  {item.adminNotes.map((note) => <p key={note}>{note}</p>)}
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/buyer-portal?supplierId=${encodeURIComponent(item.id)}`}
                className="btn-outline inline-flex gap-1.5 px-3 py-1.5 text-xs"
              >
                Supplier profile <ExternalLink size={12} />
              </Link>
              <button
                type="button"
                onClick={() => act(item.id, "approve")}
                disabled={busyId === item.id}
                className="btn-blue inline-flex gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button
                type="button"
                onClick={() => act(item.id, "request_info")}
                disabled={busyId === item.id}
                className="btn-outline inline-flex gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                <MessageSquareMore size={13} /> Request info
              </button>
              <button
                type="button"
                onClick={() => act(item.id, "reject")}
                disabled={busyId === item.id}
                className="btn-outline inline-flex gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

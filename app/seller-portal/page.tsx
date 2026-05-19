"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  RefreshCcw,
  Send,
  XCircle,
} from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import { useAuthSession } from "@/components/auth/session";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

type RfpRequest = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  supplierId: string;
  supplierName: string;
  requirement: string;
  status: "requested" | "viewed" | "responded" | "declined";
  requestedAt: string;
  updatedAt: string;
  sellerResponse?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusClass(status: RfpRequest["status"]) {
  switch (status) {
    case "responded":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "declined":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    case "viewed":
      return "border-blue-500/30 bg-blue-500/10 text-blue-100";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }
}

export default function SellerPortalPage() {
  const session = useAuthSession();
  const [rfps, setRfps] = useState<RfpRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (session?.supplierId) params.set("supplierId", session.supplierId);
    if (session?.companyName) params.set("supplierName", session.companyName);
    return params.toString();
  }, [session?.companyName, session?.supplierId]);

  const loadRfps = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/seller/rfp${queryString ? `?${queryString}` : ""}`);
    const json = (await response.json()) as { rfps?: RfpRequest[] };
    const next = json.rfps ?? [];
    setRfps(next);
    setDrafts((current) => {
      const merged = { ...current };
      for (const rfp of next) merged[rfp.id] = merged[rfp.id] ?? rfp.sellerResponse ?? "";
      return merged;
    });
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    void loadRfps();
  }, [loadRfps]);

  const updateRfp = async (id: string, status: "responded" | "declined") => {
    const responseText = drafts[id]?.trim() ?? "";
    if (status === "responded" && !responseText) {
      setMessage("Add a response before sending it to the buyer.");
      return;
    }

    setSavingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/seller/rfp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          response: responseText,
          status,
        }),
      });
      const json = (await response.json()) as { ok?: boolean; rfp?: RfpRequest; message?: string };
      if (!response.ok || !json.ok || !json.rfp) {
        setMessage(json.message ?? "Could not update this RFP.");
        return;
      }

      setRfps((current) => current.map((rfp) => (rfp.id === id ? json.rfp! : rfp)));
      setMessage(status === "declined" ? "RFP declined." : "Response sent to buyer.");
    } catch {
      setMessage("Could not update this RFP. Please retry.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AuthGate allowed={["seller", "admin"]}>
      {() => (
        <div className="app-shell">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-teal)]">
                  Seller RFP workspace
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-zinc-50 sm:text-3xl">RFPs received</h1>
                <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                  Review buyer requirements and send a concise capability response back to the buyer portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadRfps()}
                className="btn-outline w-full gap-2 py-2 text-sm sm:w-auto"
              >
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>

            {message ? (
              <p className="mb-4 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                {message}
              </p>
            ) : null}

            <section className="enterprise-panel overflow-hidden rounded-lg">
              <div className="flex flex-col gap-2 border-b border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                  <ClipboardList size={15} className="text-[color:var(--brand-teal)]" /> Incoming requests
                </p>
                <span className="text-xs font-semibold text-zinc-500">
                  {loading ? "Loading..." : `${rfps.length} request${rfps.length === 1 ? "" : "s"}`}
                </span>
              </div>

              <div className="divide-y divide-[color:var(--border)]">
                {rfps.map((rfp) => (
                  <article key={rfp.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_420px]">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-100">{rfp.id}</span>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold capitalize", statusClass(rfp.status))}>
                          {rfp.status}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-zinc-100">{rfp.buyerName}</h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        Requested {formatDate(rfp.requestedAt)} by {rfp.buyerEmail}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-zinc-400">{rfp.requirement}</p>
                      {rfp.sellerResponse ? (
                        <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                          <p className="mb-1 flex items-center gap-2 text-xs font-bold text-zinc-100">
                            <MessageSquareText size={13} className="text-[color:var(--brand-teal)]" /> Current response
                          </p>
                          <p className="text-xs leading-5 text-zinc-400">{rfp.sellerResponse}</p>
                        </div>
                      ) : null}
                    </div>

                    <form
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void updateRfp(rfp.id, "responded");
                      }}
                    >
                      <label className="text-xs font-bold text-zinc-100" htmlFor={`response-${rfp.id}`}>
                        Seller response
                      </label>
                      <textarea
                        id={`response-${rfp.id}`}
                        value={drafts[rfp.id] ?? ""}
                        onChange={(event) => setDrafts((current) => ({ ...current, [rfp.id]: event.target.value }))}
                        placeholder="Share availability, fit, lead time, commercial next step, or clarification needed."
                        className="mt-2 min-h-32 w-full resize-y rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-soft)]"
                      />
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="submit"
                          disabled={savingId === rfp.id}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[color:var(--brand-teal)] px-4 py-2 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send size={14} /> {savingId === rfp.id ? "Sending..." : "Send response"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateRfp(rfp.id, "declined")}
                          disabled={savingId === rfp.id}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </div>
                    </form>
                  </article>
                ))}

                {!loading && rfps.length === 0 ? (
                  <div className="px-4 py-16 text-center text-zinc-500">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-zinc-700" />
                    <p className="text-sm font-medium">No RFPs have been received yet.</p>
                  </div>
                ) : null}
              </div>
            </section>
          </main>
        </div>
      )}
    </AuthGate>
  );
}

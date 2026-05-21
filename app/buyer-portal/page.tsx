"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle,
  Download,
  ExternalLink,
  Globe,
  Link2,
  MessageCircle,
  Search,
  Send,
  Shield,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AuthGate from "@/components/auth/AuthGate";
import { NAICS_CODES, UNSPSC_CODES } from "@/lib/constants";
import { formatNaicsCode, formatUnspscCode } from "@/lib/code-labels";
import { cn, getCertTypeLabel } from "@/lib/utils";
import { trustLevelLabel, type RiskLevel } from "@/lib/domains/contracts";
import type { CertType, CertStatus } from "@/types";

type ResultRow = {
  supplier: {
    id: string;
    business_name: string;
    country: string;
    industry_codes: string[];
    category_codes: string[];
    designations: string[];
    cert_type: CertType;
    cert_status: CertStatus;
    trust_score: number;
    blockchain_verified: boolean;
    women_owned: boolean;
    last_verified?: string;
    business_summary?: string;
    clients_worked_with?: string;
  };
  profile: {
    trustLevel: "self_declared" | "self_certified" | "digitally_certified";
    trustScore: number;
    riskLevel: RiskLevel;
    lastVerified: string;
    verificationSummary?: {
      ownershipVerified: boolean;
      identityMatch: "high" | "medium" | "low";
      documentConsistency: "clean" | "minor_flag" | "major_flag";
      sanctionsCheck: "clear" | "flagged" | "pending";
      entityVerification: "verified" | "pending" | "mismatch";
    };
  };
  match: {
    matchScore: number;
    certificationPriority: number;
    rankReason: string;
  };
};

type CertificateListItem = {
  id: string;
  companyName: string;
  revoked: boolean;
};

type ChatMessage = {
  id: string;
  author: "buyer" | "seller";
  body: string;
  timestamp: string;
};

type RfpRequest = {
  id: string;
  supplierId: string;
  supplierName: string;
  requirement: string;
  status: "requested" | "viewed" | "responded" | "declined";
  requestedAt: string;
  updatedAt: string;
  sellerResponse?: string;
};

type SocialAccount = {
  label: string;
  handle: string;
  href: string;
};

type SocialPost = {
  id: string;
  channel: string;
  body: string;
  metric: string;
  postedAt: string;
};

interface Filters {
  query: string;
  cert_type: CertType | "";
  cert_status: CertStatus | "";
  naics: string;
  country: string;
  women_owned: boolean | null;
}

const EMPTY_FILTERS: Filters = {
  query: "",
  cert_type: "",
  cert_status: "",
  naics: "",
  country: "",
  women_owned: null,
};

const BUYER_SEGMENTS = [
  "Enterprise procurement teams",
  "Regional sourcing managers",
  "Diversity spend programs",
  "Category leads",
  "Global supply chain teams",
  "Mid-market buyers",
];

const ASSISTANT_SUGGESTIONS = [
  "Healthcare suppliers with Digital-Cert",
  "Women-led tech companies in United States",
  "Manufacturing firms with B-Corp certification",
  "Small businesses in the energy sector",
  "Food service companies in New York",
];

function hashText(text: string): number {
  return [...text].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatCodeLabels(codes: string[], labels: Map<string, string>, kind: "naics" | "unspsc") {
  return codes.map((code) => labels.get(code) ?? (kind === "naics" ? formatNaicsCode(code) : formatUnspscCode(code)));
}

function generatedKeywords(row: ResultRow, naicsLabels: Map<string, string>, unspscLabels: Map<string, string>) {
  const source = [
    row.supplier.business_name,
    row.supplier.country,
    row.supplier.business_summary,
    ...row.supplier.designations,
    ...formatCodeLabels(row.supplier.industry_codes, naicsLabels, "naics"),
    ...formatCodeLabels(row.supplier.category_codes, unspscLabels, "unspsc"),
  ]
    .join(" ")
    .toLowerCase();

  const tokens = source
    .split(/[^a-z0-9+-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 3 && !["with", "from", "this", "that", "business", "supplier"].includes(token));

  return Array.from(new Set(tokens)).slice(0, 10);
}

function buyerContext(row: ResultRow) {
  const seed = hashText(row.supplier.id);
  const segment = BUYER_SEGMENTS[seed % BUYER_SEGMENTS.length];
  const repeatRate = 62 + (seed % 27);
  const recentBuys = 3 + (seed % 8);
  return {
    segment,
    repeatRate,
    recentBuys,
    leadTime: `${7 + (seed % 14)} day avg response`,
  };
}

function socialAccounts(row: ResultRow): SocialAccount[] {
  const slug = toSlug(row.supplier.business_name);
  return [
    { label: "LinkedIn", handle: `@${slug}`, href: `https://www.linkedin.com/company/${slug}` },
    { label: "X", handle: `@${slug.slice(0, 15)}`, href: `https://x.com/${slug.replace(/-/g, "").slice(0, 15)}` },
    { label: "Website", handle: `${slug}.example.com`, href: `https://${slug}.example.com` },
  ];
}

function socialPosts(row: ResultRow, keywords: string[]): SocialPost[] {
  const seed = hashText(row.supplier.id);
  const primaryKeyword = keywords[0] ?? "procurement";
  const secondaryKeyword = keywords[1] ?? "supplier readiness";
  return [
    {
      id: `${row.supplier.id}-post-1`,
      channel: "LinkedIn",
      body: `${row.supplier.business_name} shared a buyer success update on ${primaryKeyword} delivery for ${row.supplier.country} procurement teams.`,
      metric: `${24 + (seed % 58)} buyer reactions`,
      postedAt: `${2 + (seed % 5)}d ago`,
    },
    {
      id: `${row.supplier.id}-post-2`,
      channel: "X",
      body: `New capacity note: accepting conversations for ${secondaryKeyword} projects with verified enterprise buyers this quarter.`,
      metric: `${8 + (seed % 19)} reposts`,
      postedAt: `${5 + (seed % 8)}d ago`,
    },
  ];
}

function initialChatMessages(row: ResultRow): ChatMessage[] {
  return [
    {
      id: `${row.supplier.id}-seller-1`,
      author: "seller",
      body: `Hi, this is ${row.supplier.business_name}. We can share capability details, certifications, and buyer references for your sourcing review.`,
      timestamp: "09:30",
    },
    {
      id: `${row.supplier.id}-buyer-1`,
      author: "buyer",
      body: "Thanks. I am reviewing fit, trust score, and recent buyer activity before inviting suppliers to the next sourcing round.",
      timestamp: "09:32",
    },
    {
      id: `${row.supplier.id}-seller-2`,
      author: "seller",
      body: `Happy to help. Our profile is currently ${row.supplier.cert_status}, and we typically respond with scope details within ${buyerContext(row).leadTime}.`,
      timestamp: "09:34",
    },
  ];
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function rfpStatusClass(status: RfpRequest["status"]) {
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

export default function BuyerPortalPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [assistantMode, setAssistantMode] = useState<"ai" | "search">("ai");
  const [assistantDraft, setAssistantDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [recommendations, setRecommendations] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"verify" | "rfp" | "audit" | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessagesBySupplier, setChatMessagesBySupplier] = useState<Record<string, ChatMessage[]>>({});
  const [rfpComposerOpen, setRfpComposerOpen] = useState(false);
  const [rfpMessage, setRfpMessage] = useState("");
  const [rfpRequests, setRfpRequests] = useState<RfpRequest[]>([]);
  const [requestedSupplierId] = useState(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("supplierId"),
  );

  const loadRfps = useCallback(async () => {
    const res = await fetch("/api/buyer/rfp");
    const json = (await res.json()) as { rfps?: RfpRequest[] };
    setRfpRequests(json.rfps ?? []);
  }, []);

  const runAssistantSearch = (value = assistantDraft) => {
    const query = value.trim();
    const normalized = query.toLowerCase();

    setSelected(null);
    setAssistantDraft(query);
    setFilters({
      query,
      cert_type: normalized.includes("digital-cert") || normalized.includes("digital certified") ? "digital" : "",
      cert_status: normalized.includes("active") ? "active" : "",
      naics: normalized.includes("health") || normalized.includes("medical")
        ? "62"
        : normalized.includes("manufactur") || normalized.includes("textile")
          ? "31-33"
          : normalized.includes("energy") || normalized.includes("utility")
            ? "22"
            : normalized.includes("food") || normalized.includes("hospitality")
              ? "72"
              : normalized.includes("tech") || normalized.includes("software") || normalized.includes("digital")
                ? "54"
                : "",
      country: normalized.includes("united states") || normalized.includes("boston") || normalized.includes("austin") || normalized.includes("new york")
        ? "United States"
        : normalized.includes("india")
          ? "India"
          : normalized.includes("canada")
            ? "Canada"
            : "",
      women_owned: normalized.includes("women-led") || normalized.includes("women owned") || normalized.includes("women-owned") ? true : null,
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (filters.query) qs.set("query", filters.query);
      if (filters.cert_type) qs.set("cert_type", filters.cert_type);
      if (filters.country) qs.set("country", filters.country);
      if (filters.naics) qs.set("naics", filters.naics);
      if (filters.women_owned !== null) qs.set("women_owned", String(filters.women_owned));

      const res = await fetch(`/api/buyer/search?${qs.toString()}`);
      const json = (await res.json()) as { results?: ResultRow[]; recommendations?: ResultRow[] };
      const resultRows = (json.results ?? []).filter((r) =>
        filters.cert_status ? r.supplier.cert_status === filters.cert_status : true,
      );
      setRows(resultRows);
      setRecommendations((json.recommendations ?? []).slice(0, 6));
      setLoading(false);
    };
    void load();
  }, [filters]);

  useEffect(() => {
    void loadRfps();
  }, [loadRfps]);

  const selectedId = selected ?? requestedSupplierId;
  const supplier = useMemo(() => rows.find((s) => s.supplier.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    setRfpComposerOpen(false);
    setRfpMessage("");
  }, [selectedId]);

  const naicsLabelByCode = useMemo(
    () =>
      new Map(
        NAICS_CODES.map((entry) => [
          entry.code,
          `${entry.code} - ${entry.label}`,
        ]),
      ),
    [],
  );
  const unspscLabelByCode = useMemo(
    () =>
      new Map(
        UNSPSC_CODES.map((entry) => [
          entry.code,
          `${entry.code} - ${entry.label}`,
        ]),
      ),
    [],
  );
  const similarSuppliers = useMemo(() => {
    if (!supplier) return [];
    const selectedIndustries = new Set(supplier.supplier.industry_codes);
    return rows
      .filter((row) => row.supplier.id !== supplier.supplier.id)
      .filter((row) => row.supplier.industry_codes.some((code) => selectedIndustries.has(code)))
      .slice(0, 3);
  }, [rows, supplier]);
  const supplierKeywords = useMemo(
    () => (supplier ? generatedKeywords(supplier, naicsLabelByCode, unspscLabelByCode) : []),
    [naicsLabelByCode, supplier, unspscLabelByCode],
  );
  const selectedBuyerContext = supplier ? buyerContext(supplier) : null;
  const supplierSocialAccounts = supplier ? socialAccounts(supplier) : [];
  const supplierSocialPosts = supplier ? socialPosts(supplier, supplierKeywords) : [];
  const selectedChatMessages = supplier ? chatMessagesBySupplier[supplier.supplier.id] ?? initialChatMessages(supplier) : [];

  const runVerifyCert = async () => {
    if (!supplier) return;
    setActionLoading("verify");
    setActionMessage("");
    try {
      const res = await fetch("/api/certificate");
      const json = (await res.json()) as { certificates?: CertificateListItem[] };
      const byName = (json.certificates ?? []).find(
        (cert) =>
          !cert.revoked &&
          cert.companyName.trim().toLowerCase() === supplier.supplier.business_name.trim().toLowerCase(),
      );

      if (byName) {
        window.location.href = `/verify/${byName.id}`;
        return;
      }

      setActionMessage(
        supplier.supplier.cert_status === "active"
          ? "No active certificate record found yet for this supplier. Please try again after issuance sync."
          : "This supplier does not have an active certificate yet.",
      );
    } catch {
      setActionMessage("Could not verify certificate right now. Please retry.");
    } finally {
      setActionLoading(null);
    }
  };

  const runInviteRfp = async () => {
    if (!supplier) return;
    const message = rfpMessage.trim();
    if (!message) {
      setActionMessage("Type an RFP message before sending the request.");
      return;
    }

    setActionLoading("rfp");
    setActionMessage("");
    try {
      const res = await fetch("/api/buyer/rfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.supplier.id,
          supplierName: supplier.supplier.business_name,
          buyerQuery: message,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; inviteId?: string; message?: string };
      if (!res.ok || !json.ok) {
        setActionMessage(json.message ?? "Failed to send RFP invite.");
        return;
      }
      setActionMessage(`RFP invite sent successfully (${json.inviteId}).`);
      setRfpComposerOpen(false);
      setRfpMessage("");
      await loadRfps();
    } catch {
      setActionMessage("Could not send RFP invite. Please retry.");
    } finally {
      setActionLoading(null);
    }
  };

  const runStartChat = () => {
    if (!supplier) return;
    setChatOpen(true);
    setChatMessagesBySupplier((current) => ({
      ...current,
      [supplier.supplier.id]: current[supplier.supplier.id] ?? initialChatMessages(supplier),
    }));
    setActionMessage(
      `Chat opened with ${supplier.supplier.business_name}. Share your requirements, timeline, and documents to start seller engagement.`,
    );
  };

  const sendChatMessage = () => {
    if (!supplier) return;
    const body = chatDraft.trim();
    if (!body) return;
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const buyerMessage: ChatMessage = {
      id: `${supplier.supplier.id}-buyer-${now.getTime()}`,
      author: "buyer",
      body,
      timestamp,
    };
    const replyMessage: ChatMessage = {
      id: `${supplier.supplier.id}-seller-${now.getTime()}`,
      author: "seller",
      body: `Received. ${supplier.supplier.business_name} will prepare a short capability response and suggested next step for this requirement.`,
      timestamp,
    };
    setChatMessagesBySupplier((current) => ({
      ...current,
      [supplier.supplier.id]: [
        ...(current[supplier.supplier.id] ?? initialChatMessages(supplier)),
        buyerMessage,
        replyMessage,
      ],
    }));
    setChatDraft("");
  };

  const runAuditReport = async () => {
    if (!supplier) return;
    setActionLoading("audit");
    setActionMessage("");
    try {
      const res = await fetch("/api/buyer/audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier,
          query: filters.query,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        fileName?: string;
        content?: string;
        message?: string;
      };
      if (!res.ok || !json.ok || !json.content || !json.fileName) {
        setActionMessage(json.message ?? "Failed to generate audit report.");
        return;
      }
      const blob = new Blob([json.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.fileName;
      a.click();
      URL.revokeObjectURL(url);
      setActionMessage(`Audit report downloaded (${json.fileName}).`);
    } catch {
      setActionMessage("Could not generate audit report. Please retry.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AuthGate allowed={["buyer", "seller", "buyer_admin"]}>
      {(session) => (
    <div className="app-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:pr-[360px]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-teal)]">Buyer sourcing workspace</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-zinc-50 sm:text-3xl">Discover verified suppliers</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">Review organization details, trust signals, buyer activity, and seller engagement options in one procurement-ready view.</p>
          </div>
          <button className="btn-outline gap-2 py-2 text-sm w-full sm:w-auto">
            <Download size={14} />Export CSV
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3 text-xs text-[color:var(--muted-strong)]">
          Ranking policy: <strong>Digital Certified</strong> comes first, followed by <strong>Self-Certified</strong> and <strong>Self-Declared</strong> suppliers. Trust score and match relevance refine the final order.
        </div>

        <section className="enterprise-panel mb-5 overflow-hidden rounded-lg">
          <div className="flex flex-col gap-2 border-b border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                <BriefcaseBusiness size={15} className="text-[color:var(--brand-teal)]" /> RFP requests
              </p>
              <p className="mt-1 text-xs text-zinc-500">Track requested RFPs, seller status, and latest response.</p>
            </div>
            <span className="text-xs font-semibold text-zinc-500">{rfpRequests.length} active request{rfpRequests.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-[color:var(--card-muted)] text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-bold">RFP</th>
                  <th className="px-4 py-3 font-bold">Seller</th>
                  <th className="px-4 py-3 font-bold">Requirement</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Seller response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {rfpRequests.map((rfp) => (
                  <tr key={rfp.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-100">{rfp.id}</p>
                      <p className="mt-1 text-zinc-500">{formatShortDate(rfp.requestedAt)}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-200">{rfp.supplierName}</td>
                    <td className="max-w-xs px-4 py-3 leading-5 text-zinc-400">{rfp.requirement}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 font-bold capitalize", rfpStatusClass(rfp.status))}>
                        {rfp.status}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-3 leading-5 text-zinc-400">
                      {rfp.sellerResponse || "Awaiting seller response"}
                    </td>
                  </tr>
                ))}
                {rfpRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No RFPs requested yet. Select a supplier and use Invite to RFP.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {session.role === "seller" ? (
          <div className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted-strong)]">
            <p className="font-semibold">Seller profile view</p>
            <p className="mt-1 text-xs text-emerald-100/80">
              {session.companyName ?? "Your company"} is visible in this buyer portal. Select your profile to review the buyer-facing details.
            </p>
          </div>
        ) : null}

        {recommendations.length > 0 && (
          <section className="enterprise-panel mb-5 rounded-lg p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Sparkles size={14} className="text-[color:var(--brand-teal)]" /> Similar buyers bought from these recommended suppliers
            </p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {recommendations.map((row) => (
                <button
                  key={row.supplier.id}
                  onClick={() => setSelected(row.supplier.id)}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-3 text-left transition-colors hover:border-[color:var(--border-strong)]"
                >
                  <p className="text-sm font-semibold text-zinc-100">{row.supplier.business_name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{buyerContext(row).segment}</p>
                  <p className="mt-2 text-xs font-semibold text-[color:var(--brand-teal)]">Match Score: {row.match.matchScore}%</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mb-5 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--card-elevated)] p-4 shadow-[var(--shadow-soft)] lg:fixed lg:right-6 lg:top-24 lg:z-30 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:w-[320px] lg:overflow-y-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#a855f7,#2563eb)] text-white shadow-sm">
                <Sparkles size={16} />
              </span>
              <h2 className="text-base font-bold text-[color:var(--foreground)] sm:text-lg">Search Assistant</h2>
            </div>
            {(filters.query || filters.cert_type || filters.cert_status || filters.naics || filters.country || filters.women_owned !== null) && (
              <button
                type="button"
                onClick={() => {
                  setAssistantDraft("");
                  setFilters(EMPTY_FILTERS);
                  setSelected(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAssistantMode("ai")}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-colors sm:text-sm",
                assistantMode === "ai"
                  ? "border-transparent bg-[linear-gradient(135deg,#a855f7,#2563eb)] text-white shadow-sm"
                  : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)]",
              )}
            >
              <Sparkles size={14} />AI
            </button>
            <button
              type="button"
              onClick={() => setAssistantMode("search")}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-colors sm:text-sm",
                assistantMode === "search"
                  ? "border-transparent bg-[linear-gradient(135deg,#087f8c,#2563eb)] text-white shadow-sm"
                  : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)]",
              )}
            >
              <Search size={15} />Search
            </button>
          </div>

          <form
            className="mb-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              runAssistantSearch();
            }}
          >
            <div className="relative flex-1">
              <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fuchsia-500" />
              <input
                className="h-11 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--card)] px-3 pl-9 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-colors placeholder:text-[color:var(--muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring-soft)]"
                placeholder={assistantMode === "ai" ? "Ask me anything..." : "Search verified suppliers..."}
                value={assistantDraft}
                onChange={(event) => setAssistantDraft(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#c084fc,#60a5fa)] text-white shadow-sm transition-transform hover:-translate-y-0.5"
              aria-label="Run supplier search"
            >
              <Send size={16} />
            </button>
          </form>

          <p className="mb-2.5 text-xs font-bold text-[color:var(--muted-strong)]">Try asking:</p>
          <div className="space-y-2">
            {ASSISTANT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => runAssistantSearch(suggestion)}
                className="block min-h-9 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-left text-xs font-semibold text-[color:var(--muted-strong)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        <p className="mb-4 text-sm text-zinc-500">
          {loading ? "Loading..." : `${rows.length} supplier${rows.length !== 1 ? "s" : ""} found`}
        </p>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className={cn("space-y-3", supplier ? "lg:col-span-5" : "lg:col-span-12 grid grid-cols-1 gap-4 space-y-0 sm:grid-cols-2 lg:grid-cols-3")}>
            {rows.map((row) => (
              <div key={row.supplier.id} onClick={() => setSelected(row.supplier.id === selectedId ? null : row.supplier.id)} className={cn("enterprise-panel cursor-pointer rounded-lg p-5 shadow transition-all hover:-translate-y-0.5 hover:shadow-md", selectedId === row.supplier.id && "ring-2 ring-[color:var(--brand-rose)]")}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{row.supplier.business_name}</h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                      <Globe size={11} />{row.supplier.country}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-100">{row.profile.trustScore}</p>
                    <p className="text-[10px] text-zinc-500">Trust Score</p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--card-muted)] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand-teal)]">
                    <Shield size={11} /> {trustLevelLabel(row.profile.trustLevel)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--card-muted)] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand-plum)]">
                    <TrendingUp size={11} /> {row.match.matchScore}% match
                  </span>
                </div>
                <p className="mb-1 text-xs text-zinc-400">
                  Category (NAICS):{" "}
                  <span className="text-zinc-200">
                    {row.supplier.industry_codes.length
                      ? naicsLabelByCode.get(row.supplier.industry_codes[0]) ?? formatNaicsCode(row.supplier.industry_codes[0])
                      : "N/A"}
                  </span>
                </p>
                <p className="mb-1 text-xs text-zinc-400">
                  Risk Level: <span className="text-zinc-200">{row.profile.riskLevel}</span>
                </p>
                <p className="mb-2 text-xs text-zinc-400">
                  Last Verified: <span className="text-zinc-200">{row.profile.lastVerified || "N/A"}</span>
                </p>
                <p className="mb-3 text-xs leading-5 text-zinc-500">{row.supplier.business_summary ?? "Business summary unavailable."}</p>
                <p className="mb-2 text-xs text-zinc-400">{row.supplier.clients_worked_with ?? "Worked with 5 clients (mock)"}</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", row.supplier.cert_type === "digital" ? "border-[color:var(--brand-teal)] bg-[color:var(--card-muted)] text-[color:var(--brand-teal)]" : "border-zinc-800 bg-transparent text-zinc-400")}>
                    {row.supplier.cert_type === "digital" ? <BadgeCheck size={11} /> : null}
                    {getCertTypeLabel(row.supplier.cert_type)}
                  </span>
                  {row.supplier.blockchain_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300"><Link2 size={9} />Blockchain</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", row.supplier.cert_status === "active" ? "border-zinc-200 bg-zinc-100 text-zinc-900" : "border-zinc-700 bg-zinc-800 text-zinc-300")}>{row.supplier.cert_status}</span>
                  <button className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100">View Profile</button>
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className={cn("py-16 text-center text-zinc-500", !supplier && "sm:col-span-2 lg:col-span-3")}>
                <Search size={32} className="mx-auto mb-2 text-zinc-700" />
                <p className="text-sm font-medium">No suppliers match your filters</p>
              </div>
            )}
          </div>

          {supplier && (
            <div className="lg:col-span-7">
              <div className="enterprise-panel sticky top-24 space-y-5 rounded-lg p-5 shadow">
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--card)] text-[color:var(--brand-plum)] shadow-sm">
                        <Building2 size={22} />
                      </div>
                      <h2 className="text-2xl font-bold leading-tight text-zinc-100">{supplier.supplier.business_name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                        <span className="inline-flex items-center gap-1.5"><Globe size={13} />{supplier.supplier.country}</span>
                        <span className={cn("inline-flex items-center gap-1.5", supplier.supplier.cert_type === "digital" && "font-semibold text-[color:var(--brand-teal)]")}>
                          <BadgeCheck size={13} />
                          {getCertTypeLabel(supplier.supplier.cert_type)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[color:var(--card)] px-4 py-3 text-center shadow-sm">
                      <div className="text-3xl font-bold text-zinc-100">{supplier.profile.trustScore}</div>
                      <div className="text-xs font-semibold text-zinc-500">Trust Score</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-500">{supplier.supplier.business_summary ?? "Business summary unavailable."}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <p className="font-semibold text-zinc-100">{supplier.match.matchScore}%</p>
                      <p className="text-zinc-500">Match</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100">{supplier.profile.riskLevel}</p>
                      <p className="text-zinc-500">Risk</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100">{supplier.supplier.cert_status}</p>
                      <p className="text-zinc-500">Status</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100">{supplier.profile.lastVerified || "N/A"}</p>
                      <p className="text-zinc-500">Verified</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runStartChat}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--brand-teal)] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageCircle size={18} />
                  Chat with seller
                </button>

                {chatOpen && (
                  <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                          <MessageCircle size={15} className="text-[color:var(--brand-teal)]" /> Seller chat
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">Demo conversation with {supplier.supplier.business_name}</p>
                      </div>
                      <span className="rounded-full bg-[color:var(--card)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--brand-teal)]">
                        Online
                      </span>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {selectedChatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "max-w-[88%] rounded-lg border px-3 py-2 text-xs leading-5",
                            message.author === "buyer"
                              ? "ml-auto border-[color:var(--brand-teal)] bg-[color:var(--brand-teal)] text-white"
                              : "border-[color:var(--border)] bg-[color:var(--card)] text-zinc-400",
                          )}
                        >
                          <p className="font-semibold">{message.author === "buyer" ? "You" : supplier.supplier.business_name}</p>
                          <p className="mt-1">{message.body}</p>
                          <p className={cn("mt-1 text-[10px]", message.author === "buyer" ? "text-white/75" : "text-zinc-500")}>
                            {message.timestamp}
                          </p>
                        </div>
                      ))}
                    </div>
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        sendChatMessage();
                      }}
                    >
                      <input
                        className="min-h-10 flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-soft)]"
                        placeholder="Type a message to the seller"
                        value={chatDraft}
                        onChange={(event) => setChatDraft(event.target.value)}
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-10 w-11 items-center justify-center rounded-md bg-[color:var(--brand-plum)] text-white transition-colors hover:brightness-110"
                        aria-label="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                    <BriefcaseBusiness size={15} className="text-[color:var(--brand-teal)]" /> Organization details
                  </p>
                  <div className="space-y-2 text-xs leading-5 text-zinc-400">
                    <p><span className="font-semibold text-zinc-100">Industry (NAICS):</span> {formatCodeLabels(supplier.supplier.industry_codes, naicsLabelByCode, "naics").join(", ") || "N/A"}</p>
                    <p><span className="font-semibold text-zinc-100">Category (UNSPSC):</span> {formatCodeLabels(supplier.supplier.category_codes, unspscLabelByCode, "unspsc").join(", ") || "N/A"}</p>
                    <p><span className="font-semibold text-zinc-100">Ownership:</span> {supplier.supplier.women_owned ? "Women-owned / women-led" : "Ownership data available"}</p>
                    {/* <p><span className="font-semibold text-zinc-100">Blockchain verified:</span> {supplier.supplier.blockchain_verified ? "Yes" : "No"}</p> */}
                    <p><span className="font-semibold text-zinc-100">Buyer activity:</span> {supplier.supplier.clients_worked_with ?? "Worked with 5 clients (mock)"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                    <Globe size={15} className="text-[color:var(--brand-teal)]" /> Seller social presence
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {supplierSocialAccounts.map((account) => (
                      <a
                        key={account.label}
                        href={account.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-xs transition-colors hover:border-[color:var(--border-strong)] hover:bg-[color:var(--card)]"
                      >
                        <span className="flex items-center justify-between gap-2 font-bold text-zinc-100">
                          {account.label}
                          <ExternalLink size={12} />
                        </span>
                        <span className="mt-1 block truncate text-zinc-500">{account.handle}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                    <Sparkles size={15} className="text-[color:var(--brand-teal)]" /> Recent seller posts
                  </p>
                  <div className="space-y-3">
                    {supplierSocialPosts.map((post) => (
                      <article key={post.id} className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                        <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                          <span className="font-bold text-[color:var(--brand-teal)]">{post.channel}</span>
                          <span className="text-zinc-500">{post.postedAt}</span>
                        </div>
                        <p className="text-xs leading-5 text-zinc-400">{post.body}</p>
                        <p className="mt-2 text-[11px] font-semibold text-zinc-500">{post.metric}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Certification", value: getCertTypeLabel(supplier.supplier.cert_type), verified: supplier.supplier.cert_type === "digital" },
                    { label: "Status", value: supplier.supplier.cert_status },
                    { label: "Risk Level", value: supplier.profile.riskLevel },
                    { label: "Last Verified", value: supplier.profile.lastVerified || "N/A" },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                      <p className="text-xs text-zinc-400">{row.label}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-zinc-100">
                        {row.verified ? <BadgeCheck size={14} className="text-[color:var(--brand-teal)]" /> : null}
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                    <Users size={15} className="text-[color:var(--brand-teal)]" /> Past buys and social context
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-lg font-bold text-zinc-100">{selectedBuyerContext?.recentBuys}</p>
                      <p className="text-zinc-500">Recent buyer engagements</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-zinc-100">{selectedBuyerContext?.repeatRate}%</p>
                      <p className="text-zinc-500">Repeat-interest signal</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Similar {selectedBuyerContext?.segment.toLowerCase()} engaged this seller. {selectedBuyerContext?.leadTime}.
                  </p>
                </div>

                {similarSuppliers.length > 0 && (
                  <div className="rounded-lg border border-[color:var(--border)] p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                      <TrendingUp size={15} className="text-[color:var(--brand-teal)]" /> Similar buyers also viewed
                    </p>
                    <div className="space-y-2">
                      {similarSuppliers.map((row) => (
                        <button
                          key={row.supplier.id}
                          type="button"
                          onClick={() => setSelected(row.supplier.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-[color:var(--border)] px-3 py-2 text-left transition-colors hover:border-[color:var(--border-strong)] hover:bg-[color:var(--card-muted)]"
                        >
                          <span>
                            <span className="block text-xs font-semibold text-zinc-100">{row.supplier.business_name}</span>
                            <span className="text-[11px] text-zinc-500">{row.supplier.country}</span>
                          </span>
                          <span className="text-xs font-bold text-[color:var(--brand-teal)]">{row.match.matchScore}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
                    <Tags size={15} className="text-[color:var(--brand-teal)]" /> Generated relevant keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {supplierKeywords.map((keyword) => (
                      <span key={keyword} className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-2.5 py-1 text-xs font-semibold text-zinc-300">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[color:var(--border)] p-4">
                  <p className="mb-2 text-xs font-semibold text-zinc-300">Designations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {supplier.supplier.designations.map((d) => (
                      <span key={d} className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-2.5 py-0.5 text-xs font-semibold text-zinc-300">{d}</span>
                    ))}
                  </div>
                </div>
                {supplier.profile.verificationSummary && (
                  <div className="rounded-lg border border-[color:var(--border)] p-4 text-xs text-zinc-300">
                    <p className="mb-2 font-semibold text-zinc-100">Verification summary</p>
                    <div className="grid grid-cols-2 gap-2">
                      <p>Sanctions: {supplier.profile.verificationSummary.sanctionsCheck}</p>
                      <p>Entity: {supplier.profile.verificationSummary.entityVerification}</p>
                      <p>Identity match: {supplier.profile.verificationSummary.identityMatch}</p>
                      <p>Document consistency: {supplier.profile.verificationSummary.documentConsistency}</p>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-[color:var(--border)] p-4 text-xs text-zinc-300">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-zinc-100"><Shield size={14} /> Trust report</p>
                  <p>Trust score: {supplier.profile.trustScore}</p>
                  <p>Risk level: {supplier.profile.riskLevel}</p>
                  <p>Trust level: {trustLevelLabel(supplier.profile.trustLevel)}</p>
                  <p>Last verified: {supplier.profile.lastVerified || "N/A"}</p>
                  <p className="mt-2 text-zinc-400">{supplier.match.rankReason}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => void runVerifyCert()}
                    disabled={actionLoading !== null}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle size={14} />
                    {actionLoading === "verify" ? "Verifying..." : "Verify Cert"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRfpComposerOpen(true);
                      setActionMessage("");
                    }}
                    disabled={actionLoading !== null}
                    className="inline-flex flex-1 items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Invite to RFP
                  </button>
                </div>
                {rfpComposerOpen ? (
                  <form
                    className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void runInviteRfp();
                    }}
                  >
                    <label className="mb-2 block text-sm font-bold text-zinc-100" htmlFor="rfp-message">
                      RFP message
                    </label>
                    <textarea
                      id="rfp-message"
                      value={rfpMessage}
                      onChange={(event) => setRfpMessage(event.target.value)}
                      placeholder="Describe your requirement, timeline, scope, budget range, or documents needed."
                      className="min-h-28 w-full resize-y rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-soft)]"
                    />
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={actionLoading !== null}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[color:var(--brand-teal)] px-4 py-2 text-sm font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={14} />
                        {actionLoading === "rfp" ? "Sending..." : "Send RFP"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRfpComposerOpen(false);
                          setRfpMessage("");
                        }}
                        disabled={actionLoading !== null}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => void runAuditReport()}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shield size={13} />
                  {actionLoading === "audit" ? "Generating report..." : "Request Audit Report"}
                </button>
                </div>
                {actionMessage ? (
                  <p className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                    {actionMessage}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
      )}
    </AuthGate>
  );
}

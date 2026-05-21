"use client";

import { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  MessageSquareMore,
  Power,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  XCircle,
} from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

type BuyerStatus = "pending" | "active" | "info_requested" | "rejected";

type BuyerOrganization = {
  id: string;
  name: string;
  segment: string;
  region: string;
  status: BuyerStatus;
  requestedAt: string;
  users: number;
  permissions: string[];
};

const INITIAL_BUYERS: BuyerOrganization[] = [
  {
    id: "bo-1001",
    name: "Global Retail Sourcing",
    segment: "Enterprise retail",
    region: "North America",
    status: "pending",
    requestedAt: "2h ago",
    users: 8,
    permissions: ["Supplier discovery", "RFP invites"],
  },
  {
    id: "bo-1002",
    name: "Civic Infrastructure Authority",
    segment: "Government",
    region: "EMEA",
    status: "pending",
    requestedAt: "9h ago",
    users: 5,
    permissions: ["Supplier discovery"],
  },
  {
    id: "bo-1003",
    name: "Meridian Health Procurement",
    segment: "Healthcare",
    region: "APAC",
    status: "active",
    requestedAt: "1d ago",
    users: 12,
    permissions: ["Supplier discovery", "RFP invites", "Audit reports"],
  },
  {
    id: "bo-1004",
    name: "Northstar Finance Group",
    segment: "Financial services",
    region: "North America",
    status: "info_requested",
    requestedAt: "2d ago",
    users: 4,
    permissions: ["Supplier discovery"],
  },
];

const STATUS_LABELS: Record<BuyerStatus, string> = {
  pending: "Pending",
  active: "Active",
  info_requested: "Info requested",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<BuyerStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  info_requested: "bg-sky-100 text-sky-800",
  rejected: "bg-rose-100 text-rose-800",
};

export default function BuyerAdminPage() {
  const [buyers, setBuyers] = useState(INITIAL_BUYERS);
  const [selectedId, setSelectedId] = useState(INITIAL_BUYERS[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const selected = buyers.find((buyer) => buyer.id === selectedId) ?? buyers[0];
  const filtered = buyers.filter((buyer) =>
    [buyer.name, buyer.segment, buyer.region].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  function updateStatus(status: BuyerStatus) {
    if (!selected) return;
    setBuyers((prev) => prev.map((buyer) => (buyer.id === selected.id ? { ...buyer, status } : buyer)));
  }

  function activatePortal() {
    if (!selected) return;
    setBuyers((prev) =>
      prev.map((buyer) =>
        buyer.id === selected.id
          ? { ...buyer, status: "active", permissions: Array.from(new Set([...buyer.permissions, "Portal access"])) }
          : buyer,
      ),
    );
  }

  function assignRoles() {
    if (!selected) return;
    setBuyers((prev) => prev.map((buyer) => (buyer.id === selected.id ? { ...buyer, users: buyer.users + 1 } : buyer)));
  }

  function configurePermissions() {
    if (!selected) return;
    setBuyers((prev) =>
      prev.map((buyer) =>
        buyer.id === selected.id
          ? { ...buyer, permissions: Array.from(new Set([...buyer.permissions, "Audit reports", "Role management"])) }
          : buyer,
      ),
    );
  }

  return (
    <AuthGate allowed={["buyer_admin"]}>
      <div className="app-shell">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-1 text-xs font-medium text-[color:var(--brand-teal)]">
                <ShieldCheck size={12} />WEConnect Buyer Admin
              </p>
              <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">Buyer Admin Dashboard</h1>
              <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted)]">
                Review new buyer registration requests, decide approvals, activate portal access, assign roles, and configure permissions.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                className="input-field w-full py-2 pl-9 text-sm"
                placeholder="Search buyer organizations..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="space-y-3 lg:col-span-5">
              {filtered.map((buyer) => (
                <button
                  key={buyer.id}
                  type="button"
                  onClick={() => setSelectedId(buyer.id)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-all",
                    selected?.id === buyer.id
                      ? "border-[color:var(--border-strong)] bg-[color:var(--card-muted)]"
                      : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--border-strong)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[color:var(--foreground)]">{buyer.name}</h2>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {buyer.segment} - {buyer.region}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", STATUS_CLASS[buyer.status])}>
                      {STATUS_LABELS[buyer.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-[color:var(--muted)]">Registration request received {buyer.requestedAt}</p>
                </button>
              ))}
            </section>

            <section className="card h-fit lg:sticky lg:top-24 lg:col-span-7">
              {selected ? (
                <>
                  <div className="flex flex-col justify-between gap-4 border-b border-[color:var(--border)] pb-5 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-teal)]">Organization review</p>
                      <h2 className="mt-2 text-xl font-bold text-[color:var(--foreground)]">{selected.name}</h2>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {selected.segment} - {selected.region} - requested {selected.requestedAt}
                      </p>
                    </div>
                    <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-bold", STATUS_CLASS[selected.status])}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      ["Buyer segment", selected.segment],
                      ["Region", selected.region],
                      ["Admin users requested", selected.users],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-3">
                        <p className="text-sm font-bold text-[color:var(--foreground)]">{value}</p>
                        <p className="text-xs text-[color:var(--muted)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-bold text-[color:var(--foreground)]">Configured permissions</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.permissions.map((permission) => (
                        <span key={permission} className="rounded-full bg-[color:var(--card-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <button type="button" onClick={() => updateStatus("active")} className="btn-blue gap-2 py-2.5 text-sm">
                      <CheckCircle2 size={15} />Approve buyer
                    </button>
                    <button type="button" onClick={() => updateStatus("rejected")} className="btn-danger gap-2 py-2.5 text-sm">
                      <XCircle size={15} />Reject buyer
                    </button>
                    <button type="button" onClick={() => updateStatus("info_requested")} className="btn-outline gap-2 py-2.5 text-sm">
                      <MessageSquareMore size={15} />Request info
                    </button>
                    <button type="button" onClick={activatePortal} className="btn-outline gap-2 py-2.5 text-sm">
                      <Power size={15} />Activate portal
                    </button>
                    <button type="button" onClick={assignRoles} className="btn-outline gap-2 py-2.5 text-sm">
                      <UserCog size={15} />Assign roles
                    </button>
                    <button type="button" onClick={configurePermissions} className="btn-outline gap-2 py-2.5 text-sm">
                      <SlidersHorizontal size={15} />Configure permissions
                    </button>
                  </div>

                  <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--foreground)]">
                      <KeyRound size={15} />Access readiness
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      Buyer portal activation checks organization approval, at least one assigned admin user, and permissions for supplier discovery, RFP invitations, and audit report access.
                    </p>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}

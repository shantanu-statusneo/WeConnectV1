"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BadgeCheck, Building2, CheckCircle2, MessageSquareMore, Power, TrendingUp } from "lucide-react";
import AuthGate from "@/components/auth/AuthGate";
import Navbar from "@/components/layout/Navbar";

const KPI = [
  { label: "Buyer organizations", value: "196", delta: "+12 this month", icon: Building2 },
  { label: "Pending requests", value: "18", delta: "6 high-priority", icon: BadgeCheck },
  { label: "Portal activations", value: "143", delta: "73% activation rate", icon: Power },
  { label: "RFPs invited", value: "1,371", delta: "+24% QoQ", icon: MessageSquareMore },
  { label: "Response rate", value: "68%", delta: "+7 pts QoQ", icon: CheckCircle2 },
  { label: "Buyer engagement", value: "81%", delta: "+9 pts QoQ", icon: Activity },
];

const MONTHLY = [
  { month: "Jan", organizations: 132, activations: 88, rfps: 148, engagement: 58 },
  { month: "Feb", organizations: 146, activations: 97, rfps: 173, engagement: 63 },
  { month: "Mar", organizations: 158, activations: 111, rfps: 216, engagement: 67 },
  { month: "Apr", organizations: 171, activations: 124, rfps: 244, engagement: 72 },
  { month: "May", organizations: 184, activations: 136, rfps: 281, engagement: 78 },
  { month: "Jun", organizations: 196, activations: 143, rfps: 309, engagement: 81 },
];

const REQUESTS = [
  { status: "Approved", value: 54, color: "#0f766e" },
  { status: "Pending", value: 28, color: "#ca8a04" },
  { status: "Info requested", value: 12, color: "#2563eb" },
  { status: "Rejected", value: 6, color: "#be123c" },
];

const SEGMENTS = [
  { segment: "Enterprise retail", buyers: 48, responseRate: 72 },
  { segment: "Government", buyers: 34, responseRate: 61 },
  { segment: "Healthcare", buyers: 29, responseRate: 76 },
  { segment: "Financial services", buyers: 26, responseRate: 64 },
  { segment: "Manufacturing", buyers: 21, responseRate: 69 },
];

export default function BuyersAnalyticsPage() {
  return (
    <AuthGate allowed={["buyer_admin"]}>
      <div className="app-shell">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-1 text-xs font-medium text-[color:var(--brand-teal)]">
              <TrendingUp size={12} />Buyers Analytics
            </p>
            <h1 className="font-display text-2xl font-bold text-[color:var(--foreground)]">Buyer Metrics</h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted)]">
              Track buyer organization growth, request outcomes, portal activation, RFP activity, response rates, and engagement.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {KPI.map((metric) => (
              <section key={metric.label} className="card p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--card-muted)] text-[color:var(--brand-plum)]">
                  <metric.icon size={18} />
                </div>
                <p className="font-display text-2xl font-bold text-[color:var(--foreground)]">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold text-[color:var(--muted)]">{metric.label}</p>
                <p className="mt-2 text-[11px] text-[color:var(--muted)]">{metric.delta}</p>
              </section>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="card lg:col-span-8">
              <h2 className="section-title mb-1">Buyer Growth</h2>
              <p className="mb-5 text-xs text-[color:var(--muted)]">Organizations, portal activations, and RFP invitations</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="organizations" stroke="#2563eb" fill="#dbeafe" name="Organizations" />
                  <Area type="monotone" dataKey="activations" stroke="#0f766e" fill="#ccfbf1" name="Portal activations" />
                  <Area type="monotone" dataKey="rfps" stroke="#7c3aed" fill="#ede9fe" name="RFPs invited" />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="card lg:col-span-4">
              <h2 className="section-title mb-1">Buyer Request Outcomes</h2>
              <p className="mb-5 text-xs text-[color:var(--muted)]">Current approval queue distribution</p>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={REQUESTS} dataKey="value" nameKey="status" innerRadius={54} outerRadius={86}>
                    {REQUESTS.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {REQUESTS.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[color:var(--muted)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.status}
                    </span>
                    <span className="font-semibold text-[color:var(--foreground)]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card">
            <h2 className="section-title mb-1">Segment Performance</h2>
            <p className="mb-5 text-xs text-[color:var(--muted)]">Buyer count and supplier response rate by buyer segment</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SEGMENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececec" />
                <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="buyers" fill="#2563eb" radius={[4, 4, 0, 0]} name="Buyers" />
                <Bar dataKey="responseRate" fill="#0f766e" radius={[4, 4, 0, 0]} name="Response rate" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </main>
      </div>
    </AuthGate>
  );
}

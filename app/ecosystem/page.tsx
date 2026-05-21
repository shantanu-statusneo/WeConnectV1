import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Cpu,
  DatabaseZap,
  FileCheck2,
  Globe,
  Handshake,
  Network,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const NODES = [
  { icon: Users,     color: "bg-[color:var(--card-muted)] text-[color:var(--brand-plum)]", title: "Suppliers",  count: "2,400+", desc: "Women-owned businesses & SMEs seeking certification and buyer connections." },
  { icon: Network,   color: "bg-[color:var(--card-muted)] text-[color:var(--brand-teal)]", title: "Buyers",     count: "180+",   desc: "Corporate procurement teams searching for verified diverse suppliers." },
  { icon: Cpu,       color: "bg-[color:var(--card-muted)] text-[color:var(--brand-plum)]", title: "Certifiers", count: "34",     desc: "Accredited bodies and assessors validating supplier credentials." },
  { icon: Globe,     color: "bg-[color:var(--card-muted)] text-[color:var(--brand-teal)]", title: "Markets",    count: "12",     desc: "Industry and geographic marketplaces powered by verified supplier data." },
];

const NEWCO = [
  "WOB Certification (Current)",
  "MBE (Minority-Owned Business)",
  "LGBTQ+-Owned Business",
  "Veteran-Owned Business",
  "Small Business Certification",
  "Global Certifier Equivalents",
];

const PLATFORM_LAYERS = [
  { icon: FileCheck2, label: "Certification", color: "text-[color:var(--brand-gold)]" },
  { icon: Scale, label: "Compliance", color: "text-[color:var(--brand-plum)]" },
  { icon: Bot, label: "AI enablement", color: "text-[color:var(--brand-rose)]" },
  { icon: DatabaseZap, label: "CRM signals", color: "text-[color:var(--brand-teal)]" },
];

function EcosystemFlowDiagram() {
  const supplierCategories = ["Manufacturing", "Services", "Technology", "Healthcare"];
  const buyerCategories = ["Enterprise", "Government", "State & Local", "Finance"];

  return (
    <section className="enterprise-panel mb-8 overflow-hidden rounded-lg p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[color:var(--brand-rose)]">Marketplace Flow</p>
          <h2 className="font-display text-xl font-bold text-[color:var(--foreground)]">How WEConnect Links Suppliers to Buyers</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-2.5 py-1"><span className="h-2 w-5 rounded-full bg-[color:var(--brand-plum)]" /> Supplier intake</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-2.5 py-1"><span className="h-2 w-5 rounded-full bg-[color:var(--brand-teal)]" /> Buyer access</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-2.5 py-1"><span className="h-0.5 w-5 border-t-2 border-dashed border-[color:var(--brand-coral)]" /> Opportunity loop</span>
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(201,79,124,0.08),rgba(255,255,255,0.34)_48%,rgba(8,127,140,0.09))] p-4 sm:p-6">
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1.18fr_auto_1fr]">
          <div className="rounded-lg border border-[rgba(201,79,124,0.24)] bg-[rgba(201,79,124,0.08)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--card)] text-[color:var(--brand-plum)] shadow-sm">
                <Users size={21} />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[color:var(--brand-plum)]">Suppliers</h3>
                <p className="text-sm font-semibold text-[color:var(--muted)]">Verified diverse businesses</p>
              </div>
            </div>
            <div className="grid gap-2">
              {supplierCategories.map((item) => (
                <span key={item} className="rounded-md border border-[rgba(201,79,124,0.18)] bg-[color:var(--card)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">{item}</span>
              ))}
            </div>
          </div>

          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--brand-plum)]">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-[color:var(--brand-coral)]" />
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[rgba(201,79,124,0.3)] bg-[color:var(--card-elevated)] p-5 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--brand-rose),var(--brand-plum)_68%,var(--brand-teal))] text-white shadow-[0_18px_48px_rgba(138,49,95,0.22)]">
              <Handshake size={34} />
            </div>
            <h3 className="font-display text-2xl font-bold text-[color:var(--foreground)]">WEConnect Hub</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-[color:var(--muted)]">Turns supplier data into trusted, procurement-ready profiles.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {PLATFORM_LAYERS.map((layer) => (
                <div key={layer.label} className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-left text-sm font-semibold text-[color:var(--foreground)]">
                  <layer.icon size={16} className={layer.color} />
                  {layer.label}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--brand-teal)]">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-[color:var(--brand-teal)]" />
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="rounded-lg border border-[rgba(8,127,140,0.24)] bg-[rgba(8,127,140,0.08)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--card)] text-[color:var(--brand-teal)] shadow-sm">
                <Network size={21} />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[color:var(--brand-teal)]">Buyers</h3>
                <p className="text-sm font-semibold text-[color:var(--muted)]">Procurement teams</p>
              </div>
            </div>
            <div className="grid gap-2">
              {buyerCategories.map((item) => (
                <span key={item} className="rounded-md border border-[rgba(8,127,140,0.18)] bg-[color:var(--card)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-[rgba(227,123,107,0.48)] bg-[rgba(227,123,107,0.09)] px-4 py-3">
          <div className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--muted-strong)] sm:flex-row sm:items-center sm:justify-center">
            <span className="text-[color:var(--brand-coral)]">RFPs, contracts, and buyer interest flow back to qualified suppliers</span>
            <ArrowRight className="hidden rotate-180 text-[color:var(--brand-coral)] sm:block" size={17} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EcosystemPage() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[color:var(--foreground)] mb-2">Ecosystem</h1>
          <p className="text-[color:var(--muted)] max-w-xl">WEConnect brings together suppliers, buyers, certifiers, and markets into one interconnected platform for inclusive procurement.</p>
        </div>

        <EcosystemFlowDiagram />

        {/* Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-10">
          {NODES.map(n => (
            <div key={n.title} className="enterprise-panel rounded-lg p-6 hover:shadow-md transition-all flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-[color:var(--border)] ${n.color}`}><n.icon size={22}/></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-zinc-100">{n.title}</h3>
                  <span className="font-bold text-zinc-500 text-lg">{n.count}</span>
                </div>
                <p className="text-sm text-zinc-400">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Data moat */}
        <div className="enterprise-panel rounded-lg p-6 mb-8">
          <h2 className="font-display font-bold text-xl text-[color:var(--foreground)] mb-5">Platform Data Moat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Users,   title: "Proprietary WOB Database", type: "Network Effects + Switching Costs", defensibility: "HIGH", desc: "100K+ verified WOB profiles (Year 3 target). Blockchain-anchored provenance cannot be forged." },
              { icon: Cpu,     title: "AI Training Data",          type: "Data Flywheel + Proprietary Tech", defensibility: "VERY HIGH", desc: "Millions of labeled documents for fraud detection. Models improve with scale — compounding advantage." },
              { icon: Shield,  title: "Blockchain Audit Trail",    type: "Regulatory + Technical",           defensibility: "VERY HIGH", desc: "Immutable provenance from day 1. Cannot replicate without full history. Becomes industry standard." },
            ].map(m => (
              <div key={m.title} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 hover:border-[color:var(--border-strong)] transition-colors">
                <m.icon size={20} className="text-[color:var(--brand-plum)] mb-3" />
                <h4 className="font-bold text-[color:var(--foreground)] text-sm mb-1">{m.title}</h4>
                <p className="text-xs text-[color:var(--muted-strong)] font-semibold mb-2">{m.type}</p>
                <p className="text-xs text-[color:var(--muted)] leading-relaxed mb-3">{m.desc}</p>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.defensibility === "VERY HIGH" ? "bg-zinc-100 text-zinc-950 border-zinc-200" : "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                  Defensibility: {m.defensibility}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* NewCo Expansion */}
        <div className="enterprise-panel rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-[color:var(--foreground)]">NewCo Ecosystem Expansion</h2>
              <p className="text-sm text-[color:var(--muted)] mt-1">WEC as blueprint for multi-certification global community</p>
            </div>
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-zinc-800 text-zinc-300 border-zinc-700">Phase 2</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {NEWCO.map((item, i) => (
              <div key={item} className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${i===0?"border-zinc-700 bg-zinc-800 font-semibold text-zinc-100":"border-zinc-800 text-zinc-400"}`}>
                <CheckCircle size={13} className={i===0?"text-zinc-100":"text-zinc-600"}/>{item}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="enterprise-band rounded-lg p-6 sm:p-10 text-center">
          <h2 className="font-display font-bold text-2xl text-[color:var(--foreground)] mb-3">Join the WEConnect Ecosystem</h2>
          <p className="text-[color:var(--muted)] mb-6 max-w-md mx-auto">Get certified and start connecting with procurement teams from global corporations.</p>
          <Link href="/dashboard" className="btn-blue gap-2 px-6 py-3 text-sm">
            Start Your Journey <ArrowRight size={16}/>
          </Link>
        </div>
      </main>
    </div>
  );
}

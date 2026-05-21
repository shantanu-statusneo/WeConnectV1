"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Crown,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { writeAuthSession, type LoginRole } from "@/components/auth/session";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const ROLE_CARDS: Array<{
  role: LoginRole;
  title: string;
  description: string;
  icon: typeof ShoppingBag;
}> = [
  {
    role: "buyer",
    title: "Buyer",
    description: "Search verified suppliers and invite matches to RFPs.",
    icon: ShoppingBag,
  },
  {
    role: "seller",
    title: "Supplier",
    description: "Open the supplier profile and continue registration if needed.",
    icon: Building2,
  },
  {
    role: "admin",
    title: "WEConnect Supplier Admin",
    description: "Review supplier certifications, risk flags, and platform analytics.",
    icon: Crown,
  },
  {
    role: "buyer_admin",
    title: "WEConnect Buyer Admin",
    description: "Approve buyer organizations and manage buyer portal access.",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("buyer");

  const nextPath = () =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");

  const roleNextPath = (fallback: string, allowedPrefixes: string[]) => {
    const next = nextPath();
    return next && next !== "/login" && allowedPrefixes.some((prefix) => next === prefix || next.startsWith(`${prefix}/`))
      ? next
      : fallback;
  };

  const loginAsBuyer = () => {
    writeAuthSession({
      role: "buyer",
      name: "Buyer User",
      email: "buyer@weconnect.demo",
      createdAt: new Date().toISOString(),
    });
    router.push("/buyer-portal");
  };

  const loginAsAdmin = () => {
    writeAuthSession({
      role: "admin",
      name: "WEConnect Supplier Admin",
      email: "supplier.admin@weconnect.demo",
      createdAt: new Date().toISOString(),
    });
    const next = nextPath();
    router.push(next && next !== "/login" && next.startsWith("/admin") && next !== "/admin/review" ? next : "/admin");
  };

  const loginAsBuyerAdmin = () => {
    writeAuthSession({
      role: "buyer_admin",
      name: "WEConnect Buyer Admin",
      email: "buyer.admin@weconnect.demo",
      createdAt: new Date().toISOString(),
    });
    router.push(roleNextPath("/buyer-admin", ["/buyer-admin", "/buyer-portal"]));
  };

  const loginAsSeller = () => {
    writeAuthSession({
      role: "seller",
      name: "Seller User",
      email: "seller@weconnect.demo",
      createdAt: new Date().toISOString(),
    });
    router.push("/en/profile");
  };

  return (
    <main className="app-shell text-[color:var(--foreground)]">
      <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <div className="enterprise-band flex flex-col justify-between overflow-hidden rounded-lg p-6">
          <div>
            <div className="mb-8 flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-lg">
                  <span className="text-xs font-bold">WE</span>
                </div>
                <span className="font-bold text-[color:var(--foreground)]">WEConnect</span>
              </Link>
              <ThemeToggle />
            </div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-plum)]">
              <LockKeyhole size={12} /> Secure role-based access
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-[color:var(--foreground)] sm:text-4xl">
              Enter the women-owned enterprise network.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[color:var(--muted)]">
              Buyers discover trusted suppliers, sellers complete certification, and WEConnect admins manage supplier and buyer operations from one polished workspace.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.role}
                type="button"
                onClick={() => setRole(card.role)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                  role === card.role
                    ? "border-[color:var(--border-strong)] bg-[color:var(--card-muted)] shadow-[0_14px_30px_rgba(201,79,124,0.12)]"
                    : "border-[color:var(--border)] bg-[color:var(--card-elevated)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--card-muted)]",
                )}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", role === card.role ? "bg-[image:var(--button-primary)] text-white" : "bg-[color:var(--card-muted)] text-[color:var(--muted)]")}>
                  <card.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[color:var(--foreground)]">{card.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[color:var(--muted)]">{card.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card flex min-h-[430px] p-5 sm:p-7">
          {role === "buyer" ? (
            <div className="flex h-full w-full flex-col justify-between">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--card-muted)] text-[color:var(--brand-plum)] ring-1 ring-[color:var(--border)]">
                  <ShoppingBag size={24} />
                </div>
                <h2 className="text-xl font-bold text-[color:var(--foreground)]">Buyer login</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Buyer access is scoped to the buyer portal and supplier discovery tools.
                </p>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo account: <span className="font-mono font-semibold text-[color:var(--foreground)]">buyer@weconnect.demo</span>
                </div>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo password: <span className="font-mono font-semibold text-[color:var(--foreground)]">*****************</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loginAsBuyer}
                className="btn-blue mt-8 w-full gap-2"
              >
                Continue as buyer <ArrowRight size={16} />
              </button>
            </div>
          ) : null}

          {role === "admin" ? (
            <div className="flex h-full w-full flex-col justify-between">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--card-muted)] text-[color:var(--brand-plum)] ring-1 ring-[color:var(--border)]">
                  <Crown size={24} />
                </div>
                <h2 className="text-xl font-bold text-[color:var(--foreground)]">WEConnect Supplier Admin login</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Supplier admins manage certification review, fraud monitoring, supplier analytics, and digital certification requests.
                </p>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo account: <span className="font-mono font-semibold text-[color:var(--foreground)]">supplier.admin@weconnect.demo</span>
                </div>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo password: <span className="font-mono font-semibold text-[color:var(--foreground)]">*****************</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loginAsAdmin}
                className="btn-purple mt-8 w-full gap-2"
              >
                Continue as supplier admin <ArrowRight size={16} />
              </button>
            </div>
          ) : null}

          {role === "buyer_admin" ? (
            <div className="flex h-full w-full flex-col justify-between">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--card-muted)] text-[color:var(--brand-teal)] ring-1 ring-[color:var(--border)]">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-xl font-bold text-[color:var(--foreground)]">WEConnect Buyer Admin login</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Buyer admins approve buyer organizations, activate portal access, assign roles, and monitor buyer engagement.
                </p>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo account: <span className="font-mono font-semibold text-[color:var(--foreground)]">buyer.admin@weconnect.demo</span>
                </div>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo password: <span className="font-mono font-semibold text-[color:var(--foreground)]">*****************</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loginAsBuyerAdmin}
                className="btn-blue mt-8 w-full gap-2"
              >
                Continue as buyer admin <ArrowRight size={16} />
              </button>
            </div>
          ) : null}

          {role === "seller" ? (
            <div className="flex h-full w-full flex-col justify-between">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--card-muted)] text-[color:var(--brand-teal)] ring-1 ring-[color:var(--border)]">
                  <Building2 size={24} />
                </div>
                <h2 className="text-xl font-bold text-[color:var(--foreground)]">Seller login</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Seller access opens the profile page. If no enterprise is registered yet, you will be sent to the registration workflow first.
                </p>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo account: <span className="font-mono font-semibold text-[color:var(--foreground)]">seller@weconnect.demo</span>
                </div>
                <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4 text-sm text-[color:var(--muted)]">
                  Demo password: <span className="font-mono font-semibold text-[color:var(--foreground)]">*****************</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loginAsSeller}
                className="btn-blue mt-8 w-full gap-2"
              >
                Continue as seller <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

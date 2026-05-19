"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Network, BookOpen, ShoppingBag, LayoutDashboard, Menu, X, LogIn, LogOut, ShieldCheck, UserRound, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { type Language } from "@/lib/i18n";
import { clearAuthSession, useAuthSession } from "@/components/auth/session";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Navbar({ language = "en" }: { language?: Language }) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthSession();
  const baseLinks = [
    { href: `/${language}/dashboard`,    label: "Seller Registration",    icon: LayoutDashboard },
    { href: `/${language}/profile`,      label: "Profile",                icon: UserRound },
    { href: `/seller-portal`, label: "Seller RFPs", icon: ClipboardList },
    { href: `/buyer-portal`, label: "Buyer Portal", icon: ShoppingBag },
    { href: `/ecosystem`,    label: "Ecosystem",    icon: Network },
    { href: `/documentation`,label: "Docs",         icon: BookOpen },
  ];
  const links = baseLinks.filter((link) => {
    if (session?.role === "buyer") return link.href === "/buyer-portal";
    if (session?.role === "seller") return link.href === `/${language}/dashboard` || link.href === `/${language}/profile` || link.href === "/seller-portal" || link.href === "/ecosystem";
    return true;
  });
  const adminLinks = session?.role === "admin"
    ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
    : [];

  const logout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--nav)] shadow-[0_10px_34px_rgba(61,31,52,0.08)] backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={`/`} className="flex items-center gap-2.5">
          <div className="brand-mark w-8 h-8 rounded-xl flex items-center justify-center">
            <span className="text-xs font-bold">WE</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight text-[color:var(--foreground)]">WEConnect</div>
            <div className="text-[10px] text-[color:var(--muted)] hidden sm:block">Women-Owned Enterprise Network</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          {[...links, ...adminLinks].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all",
                path.startsWith(href)
                  ? "bg-[color:var(--card-muted)] text-[color:var(--brand-plum)] ring-1 ring-[color:var(--border-strong)] backdrop-blur shadow-sm"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]")}>
              <Icon size={14} />{label}
            </Link>
          ))}
          <ThemeToggle className="ml-1" />
          {session ? (
            <button
              type="button"
              onClick={logout}
              className="ml-1 flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3.5 py-2 text-sm font-semibold text-[color:var(--muted)] transition-all hover:border-[color:var(--border-strong)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--brand-plum)]"
            >
              <LogOut size={14} />Logout
            </button>
          ) : (
            <Link href="/login" className="ml-1 flex items-center gap-1.5 rounded-lg bg-[image:var(--button-primary)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all">
              <LogIn size={14} />Login
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[color:var(--border)] bg-[color:var(--card-elevated)] backdrop-blur-xl animate-[slideDown_0.2s_ease-out] shadow-xl">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {[...links, ...adminLinks].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn("flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                  path.startsWith(href)
                    ? "bg-[color:var(--card-muted)] text-[color:var(--brand-plum)] ring-1 ring-[color:var(--border-strong)]"
                    : "text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]")}>
                <Icon size={16} />{label}
              </Link>
            ))}
            <ThemeToggle className="my-1 w-full justify-between" />
            {session ? (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold text-[color:var(--muted)] transition-all hover:bg-[color:var(--card-muted)] hover:text-[color:var(--brand-plum)]"
              >
                <LogOut size={16} />Logout
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-2.5 rounded-lg bg-[image:var(--button-primary)] px-4 py-3 text-sm font-semibold text-white transition-all">
                <LogIn size={16} />Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

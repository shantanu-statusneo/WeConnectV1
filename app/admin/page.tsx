import AuthGate from "@/components/auth/AuthGate";
import Navbar from "@/components/layout/Navbar";
import { AdminDashboard } from "@/components/AdminDashboard";
import DigitalCertificationRequests from "@/components/admin/DigitalCertificationRequests";

export default function SupplierAdminPortalPage() {
  return (
    <AuthGate allowed={["admin"]}>
      <div className="app-shell">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-plum)]">
              Supplier admin portal
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[color:var(--foreground)]">
              Digital Certification Review
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted)]">
              Review seller digital certification requests, approve qualified suppliers, and issue
              blockchain-backed certificates after payment hold and verification checks are complete.
            </p>
          </div>

          <div className="space-y-6">
            <DigitalCertificationRequests />
          </div>
        </main>
      </div>
    </AuthGate>
  );
}

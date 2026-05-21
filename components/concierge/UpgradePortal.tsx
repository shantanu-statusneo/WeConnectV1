import type { Dispatch, SetStateAction } from "react";
import { CertificateCard, type CertDisplay } from "../CertificateCard";
import { RegistrationDraft } from "@/lib/registration";
import { BadgeCheck, Clock3, CreditCard, RotateCcw, ShieldCheck } from "lucide-react";

type UpgradePortalProps = {
  show: boolean;
  cert: CertDisplay | null;
  verifyUrl: string;
  registration: RegistrationDraft;
  setRegistration: Dispatch<SetStateAction<RegistrationDraft>>;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
  mockCardValid: boolean;
  paid: boolean;
  onUpgrade: () => void;
};

export function UpgradePortal({
  show,
  cert,
  verifyUrl,
  registration,
  setRegistration,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  mockCardValid,
  paid,
  onUpgrade,
}: UpgradePortalProps) {
  if (!show) return null;

  const handleExpiryChange = (e) => {
  // Remove all non-digits
  let value = e.target.value.replace(/\D/g, "");
  
  // Limit to 4 digits total (MMYY)
  if (value.length > 4) {
    value = value.slice(0, 4);
  }

  // Automatically add the slash after 2 digits
  if (value.length > 2) {
    value = `${value.slice(0, 2)}/${value.slice(2)}`;
  }

  setCardExpiry(value);
};

const handleCvvChange = (e) => {
  // Remove all non-digits and limit to 4 characters (some cards use 4-digit CVVs)
  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
  setCardCvv(value);
};
  return (
    <section className="rounded-lg border border-white/40 bg-white/80 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-6">
      {cert ? (
        <div className="mb-6 opacity-60 scale-95 origin-top">
          <CertificateCard cert={cert} verifyUrl={verifyUrl || `/verify/${cert.id}`} />
        </div>
      ) : null}

      <h2 className="text-xl font-bold tracking-tight text-slate-900">Step 3: Digital Certification</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pay for digital certification to receive a provisional certificate while supplier-admin review is pending.
      </p>

      {paid ? (
        <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="flex items-center gap-2 font-bold">
            <BadgeCheck size={16} /> Digital certification request submitted
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            A provisional certificate has been issued. If the request is approved, the supplier admin will issue the blockchain-backed certificate; rejected requests are refunded.
          </p>
        </div>
      ) : null}
      
      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="email@company.com"
              value={registration.email}
              onChange={(e) => setRegistration((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="+1 (555) 000-0000"
              value={registration.phone}
              onChange={(e) => setRegistration((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </label>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
          <p className="font-bold uppercase tracking-wider text-[10px] mb-2">Process & Refund Policy</p>
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <p className="flex items-center gap-2"><Clock3 size={14} /> 72-hour review SLA</p>
            <p className="flex items-center gap-2"><CreditCard size={14} /> $100 payment hold</p>
            <p className="flex items-center gap-2"><RotateCcw size={14} /> Rejection refund</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Payment Details</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="Card number"
              value={cardNumber}
              disabled={paid}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="MM/YY"
              value={cardExpiry}
              disabled={paid}
              onChange={handleExpiryChange} // Updated handler
            />

            <input
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/10 placeholder:text-slate-400"
              placeholder="CVV"
              value={cardCvv}
              disabled={paid}
              type="password" // Keeps the input hidden/masked
              onChange={handleCvvChange} // Updated handler
            />
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            disabled={paid || !mockCardValid}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ShieldCheck size={17} /> {paid ? "Request Submitted" : "Pay $100 & Start Digital Review"}
          </button>
        </div>
      </div>
    </section>
  );
}

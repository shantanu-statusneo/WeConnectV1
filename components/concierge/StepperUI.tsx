import { CertificationType } from "@/lib/domains/contracts";
import type { CertDisplay } from "@/components/CertificateCard";
import { Match } from "./types";
import { BadgeCheck, Building2, Check, CreditCard, FileCheck2, RotateCcw, ShieldCheck } from "lucide-react";

type DisplayCertificate = CertDisplay & { revoked?: boolean };

type StepperUIProps = {
  flowSteps: readonly string[];
  currentFlowStep: number;
  match: Match | null;
  activeCertType: CertificationType;
  registrationComplete: boolean;
  selfVerificationComplete: boolean;
  visionIdPassed: boolean;
  setManualFlowStep: (v: number | null) => void;
  resetRegistration: () => void;
  confirmRegistration: () => void;
  stage: string;
  cert: DisplayCertificate | null;
};

export function StepperUI({
  flowSteps,
  currentFlowStep,
  match,
  activeCertType,
  registrationComplete,
  selfVerificationComplete,
  visionIdPassed,
  setManualFlowStep,
  resetRegistration,
  confirmRegistration,
  stage,
  cert,
}: StepperUIProps) {
  const steps = [
    {
      title: flowSteps[0],
      description: "Enter a business name or URL, review the Google-powered prefill, and confirm.",
      Icon: Building2,
      done: registrationComplete,
      accent: "cyan",
      actionLabel: match ? "Edit Details" : "Start",
      onAction: () => {
        if (match) setManualFlowStep(0);
      },
      disabled: !match,
    },
    {
      title: flowSteps[1],
      description: "Upload supporting documents, scan a valid ID on webcam, then issue the blockchain certificate.",
      Icon: ShieldCheck,
      done: selfVerificationComplete,
      accent: "emerald",
      actionLabel: registrationComplete ? "Continue" : "Confirm First",
      onAction: () => {
        if (registrationComplete) setManualFlowStep(1);
        else if (match) confirmRegistration();
      },
      disabled: !match,
    },
    {
      title: flowSteps[2],
      description: "Paid 72-hour authenticity review. Rejected digital requests are refunded.",
      Icon: CreditCard,
      done: activeCertType === "digital" && Boolean(cert),
      accent: "blue",
      actionLabel: cert ? "Open" : "After Certificate",
      onAction: () => {
        if (cert) setManualFlowStep(2);
      },
      disabled: !cert,
    },
  ] as const;

  const accentClasses: Record<string, { active: string; done: string; idle: string; icon: string }> = {
    cyan: {
      active: "border-cyan-300 bg-cyan-50 text-cyan-900",
      done: "border-emerald-200 bg-emerald-50 text-emerald-900",
      idle: "border-slate-200 bg-white text-slate-500",
      icon: "bg-cyan-600 text-white",
    },
    emerald: {
      active: "border-emerald-300 bg-emerald-50 text-emerald-900",
      done: "border-emerald-200 bg-emerald-50 text-emerald-900",
      idle: "border-slate-200 bg-white text-slate-500",
      icon: "bg-emerald-600 text-white",
    },
    blue: {
      active: "border-blue-300 bg-blue-50 text-blue-900",
      done: "border-emerald-200 bg-emerald-50 text-emerald-900",
      idle: "border-slate-200 bg-white text-slate-500",
      icon: "bg-blue-600 text-white",
    },
  };

  return (
    <section className="rounded-lg border border-white/50 bg-white/70 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Supplier Registration Workflow</h2>
          <p className="mt-1 text-xs text-slate-500">
            {match ? `${match.companyName} · Stage: ${stage}` : "Start with a company name, business name, or URL."}
          </p>
        </div>
        <button
          type="button"
          onClick={resetRegistration}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RotateCcw size={13} /> Restart
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {steps.map((step, index) => {
          const active = index === currentFlowStep;
          const stateClasses = step.done
            ? accentClasses[step.accent].done
            : active
              ? accentClasses[step.accent].active
              : accentClasses[step.accent].idle;
          const Icon = step.Icon;

          return (
            <article key={step.title} className={`rounded-lg border p-4 shadow-sm transition ${stateClasses}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    step.done ? "bg-emerald-600 text-white" : active ? accentClasses[step.accent].icon : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.done ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Step {index + 1}</p>
                  <h3 className="mt-1 text-sm font-bold">{step.title}</h3>
                  <p className="mt-1 min-h-10 text-xs leading-relaxed opacity-75">{step.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-75">
                  {index === 1 ? <FileCheck2 size={13} /> : index === 2 ? <BadgeCheck size={13} /> : <Building2 size={13} />}
                  {index === 1 && visionIdPassed ? "ID verified" : step.done ? "Complete" : active ? "Current" : "Pending"}
                </div>
                <button
                  type="button"
                  onClick={step.onAction}
                  disabled={step.disabled}
                  className="rounded-lg border border-current/15 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {step.actionLabel}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

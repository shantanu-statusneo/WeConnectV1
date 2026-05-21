import { CertificateCard, type CertDisplay } from "../CertificateCard";
import { BadgeCheck, Download, ShieldCheck } from "lucide-react";

type DisplayCertificate = CertDisplay & { revoked?: boolean };

type CertificateDisplayProps = {
  show: boolean;
  cert: DisplayCertificate | null;
  verifyUrl: string;
  downloadCertificatePdf: () => void;
  downloadingCertificate: boolean;
  setManualFlowStep: (v: number | null) => void;
  readinessForIssue: boolean;
  mergedBlockers: string[];
  anchoring: boolean;
  anchorCert: () => void;
  setAssistant: (v: string) => void;
  speakWithLanguage: (v: string) => void;
};

function humanizeBlocker(blocker: string) {
  const labels: Record<string, string> = {
    vision_id: "Webcam ID verification",
    country_confirmation: "Country confirmation",
    paid: "Payment",
    chain_submit_failed: "Blockchain anchoring service",
    chain_submit_failed_demo_fallback: "Blockchain anchoring service",
  };
  return labels[blocker] ?? blocker.replaceAll("_", " ");
}

export function CertificateDisplay({ 
  show,
  cert,
  verifyUrl,
  downloadCertificatePdf,
  downloadingCertificate,
  setManualFlowStep,
  readinessForIssue,
  mergedBlockers,
  anchoring,
  anchorCert,
  setAssistant,
  speakWithLanguage,
}: CertificateDisplayProps) {
  if (!show) return null;

  return (
    <section className="rounded-lg border border-white/40 bg-white/80 p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl sm:p-6">
       {cert ? (
         <div className="space-y-3">
           <CertificateCard cert={cert} verifyUrl={verifyUrl || `/verify/${cert.id}`} />
           <button
             type="button"
             onClick={downloadCertificatePdf}
             disabled={downloadingCertificate}
             className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#fac400] bg-[#fac400] py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:brightness-95 disabled:opacity-40"
           >
             <Download size={16} /> {downloadingCertificate ? "Preparing Certificate..." : "Download Self Verification Certificate"}
           </button>
           <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
             <p className="flex items-center justify-center gap-2 text-sm font-bold text-blue-800">
               <BadgeCheck size={16} /> Self verification certificate ready
             </p>
             <p className="mt-1 text-xs text-blue-600">Next, sellers are recommended to apply for paid Digital Certification for a 72-hour authenticity review.</p>
             <button 
               onClick={() => setManualFlowStep(2)}
               className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-500"
             >
               <ShieldCheck size={14} /> Go to Step 3
             </button>
           </div>
         </div>
       ) : (
         <div className="text-center py-8">
           <h2 className="text-xl font-bold tracking-tight text-slate-900">Self Verification Complete</h2>
           <p className="mt-1 text-sm text-slate-500">Improve visibility and increase business outreach by up to 75% through stronger trust signals and buyer discovery placement.</p>
           
           {!!mergedBlockers.length && (
            <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-bold">Missing Requirements:</p>
              <p>{mergedBlockers.map(humanizeBlocker).join(", ")}</p>
            </div>
           )}

           <button
             type="button"
             onClick={() => {
               if (!readinessForIssue) {
                 const pending = mergedBlockers.map(humanizeBlocker).join(", ");
                 const message = `Cannot continue to paid digital certification yet. Pending: ${pending}`;
                 setAssistant(message);
                 speakWithLanguage(message);
                 return;
               }
               setManualFlowStep(2);
             }}
             disabled={anchoring}
             className="mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-50"
           >
             <BadgeCheck size={17} /> Go for Digital Certification
           </button>
         </div>
       )}
    </section>
  );
}

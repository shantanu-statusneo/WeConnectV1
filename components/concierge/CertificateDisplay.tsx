import { CertificateCard, type CertDisplay } from "../CertificateCard";
import { ArrowRight, BadgeCheck, Download, Search, ShieldCheck, Sparkles, Users } from "lucide-react";

type DisplayCertificate = CertDisplay & { revoked?: boolean };

type CertificateDisplayProps = {
  show: boolean;
  cert: DisplayCertificate | null;
  verifyUrl: string;
  downloadCertificatePdf: () => void;
  downloadingCertificate: boolean;
  onStartDigitalCertification: () => void;
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
  onStartDigitalCertification,
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
           <div className="mt-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-5 text-left shadow-lg shadow-blue-100">
             <p className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
               <Sparkles size={13} /> Highest buyer visibility
             </p>
             <h2 className="mt-3 text-xl font-black tracking-tight text-blue-950">Get seen by more buyers with Digital Certification</h2>
             <p className="mt-2 text-sm leading-6 text-blue-800">
               Self verification proves your registration. Digital Certification helps procurement teams trust you faster, shortlist you for RFPs, and contact you with more confidence.
             </p>
             <div className="mt-4 grid gap-2 text-xs font-bold text-blue-900 sm:grid-cols-3">
               <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><Search size={14} /> Appear stronger in buyer search</p>
               <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><Users size={14} /> Signal readiness for enterprise RFPs</p>
               <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"><ShieldCheck size={14} /> Earn higher-trust profile signals</p>
             </div>
             <button 
               onClick={onStartDigitalCertification}
               className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-white shadow-md shadow-blue-200 transition hover:bg-blue-500"
             >
               <ShieldCheck size={16} /> Start Digital Certification <ArrowRight size={16} />
             </button>
           </div>
         </div>
       ) : (
         <div className="py-6">
           <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-5 shadow-xl shadow-blue-100 sm:p-6">
             <p className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
               <Sparkles size={13} /> Do not stop at self verification
             </p>
             <h2 className="mt-4 text-2xl font-black tracking-tight text-blue-950">Digital Certification gets you closer to buyers</h2>
             <p className="mt-2 text-sm leading-6 text-blue-800">
               Buyers are more likely to act when your profile shows stronger document checks, webcam ID verification, and supplier-admin review. This is the trust signal that helps your business stand out when procurement teams compare suppliers.
             </p>
             <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
               <div className="rounded-lg bg-white p-3 shadow-sm">
                 <Search size={17} className="text-blue-700" />
                 <p className="mt-2 text-xs font-black uppercase tracking-wider text-blue-950">Better discovery</p>
                 <p className="mt-1 text-xs leading-5 text-blue-700">Buyers filtering for verified suppliers see a stronger certification signal.</p>
               </div>
               <div className="rounded-lg bg-white p-3 shadow-sm">
                 <Users size={17} className="text-blue-700" />
                 <p className="mt-2 text-xs font-black uppercase tracking-wider text-blue-950">More buyer confidence</p>
                 <p className="mt-1 text-xs leading-5 text-blue-700">Enterprise teams can shortlist you faster for RFP outreach.</p>
               </div>
               <div className="rounded-lg bg-white p-3 shadow-sm">
                 <ShieldCheck size={17} className="text-blue-700" />
                 <p className="mt-2 text-xs font-black uppercase tracking-wider text-blue-950">Higher trust</p>
                 <p className="mt-1 text-xs leading-5 text-blue-700">Buyers see a stronger certification signal when your profile shows authenticity review beyond self-uploaded documents.</p>
               </div>
             </div>
           </div>
           
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
               onStartDigitalCertification();
             }}
             disabled={anchoring}
             className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-50"
           >
             <BadgeCheck size={17} /> Start Digital Certification Now <ArrowRight size={17} />
           </button>
         </div>
       )}
    </section>
  );
}

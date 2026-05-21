"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  Pencil,
  FileCheck2,
  Hourglass,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { readSellerSessionId, SELLER_SESSION_ID_KEY, useAuthSession, writeSellerSessionId } from "@/components/auth/session";
import { formatCodeList } from "@/lib/code-labels";
import type { Language } from "@/lib/i18n";
import type { RegistrationDraft } from "@/lib/registration";

type SellerProfileStatus =
  | "not_registered"
  | "registered"
  | "self_verified"
  | "digital_pending"
  | "digital_certified";

type SellerProfile = {
  status: SellerProfileStatus;
  sessionId?: string;
  stage?: string;
  registration?: RegistrationDraft;
  enterprise?: {
    businessName: string;
    country: string;
    companyType: string;
    ownerNames: string;
    employeeRange: string;
    revenueRange: string;
    naicsCodes: string[];
    unspscCodes: string[];
    designations: string[];
    description: string;
    email: string;
    phone: string;
  };
  certificate?: {
    id: string;
    companyName: string;
    primaryOwner: string;
    ownershipFemalePct: number;
    issuedAt: string;
    txHash: string;
    provenanceSummary?: {
      certificateKind?: "provisional" | "blockchain_backed";
    };
    validTill?: string;
    certificationType: "self" | "digital";
    downloadPath: string;
    verifyPath: string;
  } | null;
  verification?: {
    documentVerified: boolean;
    identityVerified: boolean;
    trustScore?: number;
    riskLevel?: "low" | "medium" | "high";
  };
  payment?: {
    state: "not_started" | "hold_placed" | "captured" | "refunded";
    amountUsd: number;
    holdAt?: string;
    captureAt?: string;
    refundAt?: string;
  };
  review?: {
    validTill?: string;
    digitalReviewSlaHours: number;
    renewalAmountUsd: number;
    additionalInfoRequests?: string[];
  };
};

const SELLER_PROFILE_CACHE_KEY = "weconnect.seller.profile.v1";
const SELLER_SESSION_CACHE_KEY = "weconnect.seller.session.v1";

type PersistedSellerProfile = {
  updatedAt: string;
  sessionId?: string;
  email?: string;
  companyName?: string;
  profile: SellerProfile;
};

type SellerProfileCache = Record<string, PersistedSellerProfile>;

type EditableEnterpriseDetails = {
  business_name: string;
  country: string;
  company_type: string;
  owner_details: string;
  naics_codes: string;
  unspsc_codes: string;
  num_employees: string;
  revenue_range: string;
  business_description: string;
  email: string;
  phone: string;
};

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusMeta(status: SellerProfileStatus) {
  switch (status) {
    case "digital_certified":
      return {
        label: "Digital certified",
        description: "Enterprise details and authenticity have passed digital review.",
        className: "border-blue-200 bg-blue-50 text-blue-800",
        Icon: BadgeCheck,
      };
    case "digital_pending":
      return {
        label: "Digital review pending",
        description: "Paid digital certification is under 72-hour review.",
        className: "border-amber-200 bg-amber-50 text-amber-800",
        Icon: Hourglass,
      };
    case "self_verified":
      return {
        label: "Self verified",
        description: "Documents and webcam ID are complete. Digital Certification is the next step.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        Icon: ShieldCheck,
      };
    case "registered":
      return {
        label: "Registered",
        description: "Enterprise registration is saved. Self verification is still pending.",
        className: "border-cyan-200 bg-cyan-50 text-cyan-800",
        Icon: Building2,
      };
    default:
      return {
        label: "Not registered",
        description: "Register your enterprise before opening the seller profile.",
        className: "border-slate-200 bg-slate-50 text-slate-700",
        Icon: Building2,
      };
  }
}

function cacheKeyFor(values: { sessionId?: string | null; email?: string | null; companyName?: string | null }) {
  return (values.sessionId || values.email || values.companyName || "default-seller").trim().toLowerCase();
}

function readProfileCache(): SellerProfileCache {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(SELLER_PROFILE_CACHE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SellerProfileCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    window.localStorage.removeItem(SELLER_PROFILE_CACHE_KEY);
    return {};
  }
}

function findCachedProfile(values: { sessionId?: string | null; email?: string | null; companyName?: string | null }) {
  const cache = readProfileCache();
  const keys = [
    cacheKeyFor({ sessionId: values.sessionId }),
    cacheKeyFor({ email: values.email }),
    cacheKeyFor({ companyName: values.companyName }),
  ];
  for (const key of keys) {
    const cached = cache[key];
    if (cached?.profile?.registration?.business_name.trim()) return cached.profile;
  }
  return null;
}

function writeCachedProfile(profile: SellerProfile, values: { email?: string | null; companyName?: string | null }) {
  if (typeof window === "undefined" || !profile.registration?.business_name.trim()) return;
  const nextRecord: PersistedSellerProfile = {
    updatedAt: new Date().toISOString(),
    sessionId: profile.sessionId,
    email: values.email || profile.enterprise?.email || profile.registration.email,
    companyName: values.companyName || profile.enterprise?.businessName || profile.registration.business_name,
    profile,
  };
  const cache = readProfileCache();
  const sessionKey = cacheKeyFor({ sessionId: profile.sessionId });
  cache[sessionKey] = nextRecord;
  if (nextRecord.email) cache[cacheKeyFor({ email: nextRecord.email })] = nextRecord;
  if (nextRecord.companyName) cache[cacheKeyFor({ companyName: nextRecord.companyName })] = nextRecord;
  window.localStorage.setItem(SELLER_PROFILE_CACHE_KEY, JSON.stringify(cache));
}

function removeCachedProfile(profile: SellerProfile | null, values: { email?: string | null; companyName?: string | null }) {
  if (typeof window === "undefined") return;
  const cache = readProfileCache();
  const keys = [
    cacheKeyFor({ sessionId: profile?.sessionId }),
    cacheKeyFor({ email: values.email || profile?.enterprise?.email || profile?.registration?.email }),
    cacheKeyFor({ companyName: values.companyName || profile?.enterprise?.businessName || profile?.registration?.business_name }),
  ];
  for (const key of keys) delete cache[key];
  window.localStorage.setItem(SELLER_PROFILE_CACHE_KEY, JSON.stringify(cache));
}

function writeCachedSellerSession(profile: SellerProfile) {
  if (typeof window === "undefined" || !profile.sessionId || !profile.registration) return;
  window.localStorage.setItem(
    SELLER_SESSION_CACHE_KEY,
    JSON.stringify({
      sessionId: profile.sessionId,
      registration: profile.registration,
      paid: profile.payment?.state === "hold_placed" || profile.payment?.state === "captured",
      stage: profile.stage ?? "idle",
      updatedAt: new Date().toISOString(),
    }),
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function editableFromRegistration(registration: RegistrationDraft): EditableEnterpriseDetails {
  return {
    business_name: registration.business_name,
    country: registration.country,
    company_type: registration.company_type,
    owner_details: registration.owner_details.map((owner) => owner.fullName).filter(Boolean).join(", "),
    naics_codes: registration.naics_codes.join(", "),
    unspsc_codes: registration.unspsc_codes.join(", "),
    num_employees: registration.num_employees,
    revenue_range: registration.revenue_range,
    business_description: registration.business_description,
    email: registration.email,
    phone: registration.phone,
  };
}

function registrationFromEditable(base: RegistrationDraft, form: EditableEnterpriseDetails): RegistrationDraft {
  const ownerNames = splitList(form.owner_details);
  const ownershipPct = ownerNames.length ? Math.round((100 / ownerNames.length) * 100) / 100 : 100;
  return {
    ...base,
    business_name: form.business_name.trim(),
    country: form.country.trim(),
    company_type: form.company_type.trim(),
    owner_details: ownerNames.length
      ? ownerNames.map((fullName) => ({
          fullName,
          gender: base.owner_details.find((owner) => owner.fullName === fullName)?.gender || "Unknown",
          ownershipPct,
        }))
      : base.owner_details,
    naics_codes: splitList(form.naics_codes),
    unspsc_codes: splitList(form.unspsc_codes),
    num_employees: form.num_employees.trim(),
    revenue_range: form.revenue_range.trim(),
    business_description: form.business_description.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  };
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 min-h-5 text-sm font-semibold text-[color:var(--foreground)]">{value?.trim() || "Not provided"}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  multiline = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  helperText?: string;
}) {
  const inputClass = "mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--border-strong)] focus:ring-2 focus:ring-[color:var(--card-muted)]";
  return (
    <label className={multiline ? "md:col-span-2" : undefined}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">{label}</span>
      {multiline ? (
        <textarea className={`${inputClass} min-h-28 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {helperText ? <span className="mt-1 block text-xs leading-5 text-[color:var(--muted)]">{helperText}</span> : null}
    </label>
  );
}

export function SellerProfileClient({ language = "en" }: { language?: Language }) {
  const router = useRouter();
  const session = useAuthSession();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(session?.email ?? "");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditableEnterpriseDetails | null>(null);

  const registerPath = `/${language}/dashboard`;
  const cardValid = cardNumber.replace(/\s+/g, "").length >= 12 && cardExpiry.trim().length >= 4 && cardCvv.trim().length >= 3;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const sellerSessionId = readSellerSessionId();
    try {
      const params = new URLSearchParams();
      if (sellerSessionId) params.set("sessionId", sellerSessionId);
      if (session?.email) params.set("email", session.email);
      if (session?.companyName) params.set("companyName", session.companyName);
      const response = await fetch(`/api/seller/profile?${params.toString()}`);
      const json = (await response.json()) as { profile?: SellerProfile; error?: string };
      if (!response.ok || !json.profile) {
        setMessage(json.error ?? "Could not load seller profile.");
        return;
      }
      if (json.profile.sessionId) writeSellerSessionId(json.profile.sessionId);
      if (json.profile.status === "not_registered") {
        const cachedProfile = findCachedProfile({
          sessionId: sellerSessionId,
          email: session?.email,
          companyName: session?.companyName,
        });
        if (cachedProfile?.registration) {
          setProfile(cachedProfile);
          setEmail(cachedProfile.enterprise?.email || cachedProfile.registration.email || session?.email || "");
          setPhone(cachedProfile.enterprise?.phone || cachedProfile.registration.phone || "");
          setMessage("Loaded saved demo seller data from this browser.");
          writeCachedSellerSession(cachedProfile);
          if (cachedProfile.sessionId) {
            writeSellerSessionId(cachedProfile.sessionId);
            void fetch("/api/session/registration", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: cachedProfile.sessionId,
                registration: cachedProfile.registration,
                paid: cachedProfile.payment?.state === "hold_placed" || cachedProfile.payment?.state === "captured",
              }),
            });
          }
          return;
        }
        router.replace(registerPath);
        return;
      }
      setProfile(json.profile);
      writeCachedProfile(json.profile, { email: session?.email, companyName: session?.companyName });
      writeCachedSellerSession(json.profile);
      setEmail(json.profile.enterprise?.email || session?.email || "");
      setPhone(json.profile.enterprise?.phone || "");
    } finally {
      setLoading(false);
    }
  }, [registerPath, router, session?.companyName, session?.email]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadProfile]);

  const meta = useMemo(() => statusMeta(profile?.status ?? "not_registered"), [profile?.status]);
  const StatusIcon = meta.Icon;

  const startEditing = () => {
    if (!profile?.registration) return;
    setEditForm(editableFromRegistration(profile.registration));
    setEditing(true);
    setMessage("");
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm(null);
  };

  const saveEnterpriseDetails = async () => {
    if (!profile?.sessionId || !profile.registration || !editForm) return;
    const businessName = editForm.business_name.trim();
    if (!businessName) {
      setMessage("Business name is required.");
      return;
    }
    setSavingDetails(true);
    setMessage("");
    try {
      const nextRegistration = registrationFromEditable(profile.registration, editForm);
      const response = await fetch("/api/session/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          registration: nextRegistration,
          paid: profile.payment?.state === "hold_placed" || profile.payment?.state === "captured",
        }),
      });
      if (!response.ok) {
        setMessage("Could not save enterprise details. Please try again.");
        return;
      }
      const nextProfile: SellerProfile = {
        ...profile,
        registration: nextRegistration,
        enterprise: {
          businessName: nextRegistration.business_name,
          country: nextRegistration.country,
          companyType: nextRegistration.company_type,
          ownerNames: nextRegistration.owner_details.map((owner) => owner.fullName).filter(Boolean).join(", "),
          employeeRange: nextRegistration.num_employees,
          revenueRange: nextRegistration.revenue_range,
          naicsCodes: nextRegistration.naics_codes,
          unspscCodes: nextRegistration.unspsc_codes,
          designations: nextRegistration.designations,
          description: nextRegistration.business_description,
          email: nextRegistration.email,
          phone: nextRegistration.phone,
        },
      };
      setProfile(nextProfile);
      writeCachedProfile(nextProfile, { email: session?.email, companyName: session?.companyName });
      writeCachedSellerSession(nextProfile);
      setEmail(nextRegistration.email || session?.email || "");
      setPhone(nextRegistration.phone || "");
      setEditing(false);
      setEditForm(null);
      setMessage("Enterprise details saved to this browser session.");
    } finally {
      setSavingDetails(false);
    }
  };

  const continueSelfVerification = async () => {
    if (!profile?.sessionId || !profile.registration) {
      router.push(registerPath);
      return;
    }
    setMessage("");
    const nextRegistration: RegistrationDraft = {
      ...profile.registration,
      cert_type: "self",
    };
    await fetch("/api/session/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: profile.sessionId,
        registration: nextRegistration,
        paid: false,
      }),
    });
    await fetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: profile.sessionId, stage: "doc_upload" }),
    });
    const nextProfile: SellerProfile = {
      ...profile,
      status: "registered",
      stage: "doc_upload",
      registration: nextRegistration,
    };
    setProfile(nextProfile);
    writeSellerSessionId(profile.sessionId);
    writeCachedProfile(nextProfile, { email: session?.email, companyName: session?.companyName });
    writeCachedSellerSession(nextProfile);
    router.push(registerPath);
  };

  const deleteProfile = async () => {
    if (!profile?.enterprise) return;
    const confirmed = window.confirm(`Delete ${profile.enterprise.businessName} from this seller profile? This removes the saved enterprise registration from this demo session.`);
    if (!confirmed) return;
    setDeletingProfile(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (profile.sessionId) params.set("sessionId", profile.sessionId);
      if (session?.email) params.set("email", session.email);
      if (session?.companyName) params.set("companyName", session.companyName);
      await fetch(`/api/seller/profile?${params.toString()}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          email: session?.email,
          companyName: session?.companyName,
        }),
      });
      removeCachedProfile(profile, { email: session?.email, companyName: session?.companyName });
      window.localStorage.removeItem(SELLER_SESSION_CACHE_KEY);
      window.localStorage.removeItem(SELLER_SESSION_ID_KEY);
      setProfile(null);
      setMessage("Enterprise profile deleted. Register a new enterprise to continue.");
      router.replace(registerPath);
    } finally {
      setDeletingProfile(false);
    }
  };

  const downloadCertificate = async () => {
    if (!profile?.certificate) return;
    setMessage("");
    const response = await fetch(profile.certificate.downloadPath);
    if (!response.ok) {
      setMessage("Certificate is not ready for download yet.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weconnect-certificate-${profile.certificate.id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitDigitalRequest = async () => {
    if (!profile?.sessionId || !profile.registration || !cardValid) return;
    setSubmitting(true);
    setMessage("");
    try {
      const nextRegistration: RegistrationDraft = {
        ...profile.registration,
        cert_type: "digital",
        email,
        phone,
      };
      await fetch("/api/session/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          registration: nextRegistration,
          paid: true,
        }),
      });
      await fetch("/api/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          action: "select_certification_type",
          certificationType: "digital",
        }),
      });
      await fetch("/api/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          action: "payment_transition",
          paymentState: "hold_placed",
        }),
      });
      await loadProfile();
      setMessage("Digital certification request submitted. Review SLA is 72 hours.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRenewalPayment = async () => {
    if (!profile?.sessionId || !cardValid) return;
    setSubmitting(true);
    setMessage("");
    try {
      await fetch("/api/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: profile.sessionId,
          action: "payment_transition",
          paymentState: "hold_placed",
        }),
      });
      await loadProfile();
      setMessage("Renewal payment has been queued for the next certification cycle.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <p className="text-sm text-[color:var(--muted)]">Loading seller profile...</p>
      </section>
    );
  }

  if (!profile?.enterprise) {
    return (
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h1 className="text-xl font-bold text-[color:var(--foreground)]">Seller profile unavailable</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">Please complete enterprise registration first.</p>
        <Link href={registerPath} className="btn-blue mt-5 inline-flex px-4 py-2 text-sm">
          Register enterprise
        </Link>
      </section>
    );
  }

  const enterprise = profile.enterprise;
  const isSelfVerified = profile.status === "self_verified";
  const isDigitalCertified = profile.status === "digital_certified";
  const isDigitalPending = profile.status === "digital_pending";
  const hasProvisionalCertificate = profile.certificate?.provenanceSummary?.certificateKind === "provisional";

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">Seller profile</p>
            <h1 className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{enterprise.businessName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">{meta.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={editing ? cancelEditing : startEditing}
              className="btn-outline inline-flex gap-2 px-3 py-2 text-sm"
            >
              {editing ? <X size={15} /> : <Pencil size={15} />}
              {editing ? "Cancel edit" : "Edit details"}
            </button>
            <button
              type="button"
              onClick={deleteProfile}
              disabled={deletingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-45"
            >
              <Trash2 size={15} /> {deletingProfile ? "Deleting..." : "Delete profile"}
            </button>
            <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${meta.className}`}>
              <StatusIcon size={16} /> {meta.label}
            </div>
          </div>
        </div>
        {message ? (
          <p className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-sm text-[color:var(--muted)]">
            {message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailRow label="Country" value={enterprise.country} />
        <DetailRow label="Company type" value={enterprise.companyType} />
        <DetailRow label="Primary owner" value={enterprise.ownerNames} />
        <DetailRow label="Current stage" value={profile.stage} />
      </section>

      <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-[color:var(--foreground)]">
            <Building2 size={17} /> Enterprise details
          </h2>
          {editing ? (
            <button
              type="button"
              onClick={saveEnterpriseDetails}
              disabled={savingDetails || !editForm?.business_name.trim()}
              className="btn-blue inline-flex gap-2 px-4 py-2 text-sm disabled:opacity-45"
            >
              <Save size={15} /> {savingDetails ? "Saving..." : "Save changes"}
            </button>
          ) : null}
        </div>
        {editing && editForm ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <EditField label="Business name" value={editForm.business_name} onChange={(value) => setEditForm({ ...editForm, business_name: value })} />
            <EditField label="Country" value={editForm.country} onChange={(value) => setEditForm({ ...editForm, country: value })} />
            <EditField label="Company type" value={editForm.company_type} onChange={(value) => setEditForm({ ...editForm, company_type: value })} />
            <EditField label="Primary owners" value={editForm.owner_details} onChange={(value) => setEditForm({ ...editForm, owner_details: value })} />
            <EditField label="NAICS codes" value={editForm.naics_codes} onChange={(value) => setEditForm({ ...editForm, naics_codes: value })} helperText={formatCodeList(splitList(editForm.naics_codes), "naics", "No NAICS code selected")} />
            <EditField label="UNSPSC codes" value={editForm.unspsc_codes} onChange={(value) => setEditForm({ ...editForm, unspsc_codes: value })} helperText={formatCodeList(splitList(editForm.unspsc_codes), "unspsc", "No UNSPSC code selected")} />
            <EditField label="Employees" value={editForm.num_employees} onChange={(value) => setEditForm({ ...editForm, num_employees: value })} />
            <EditField label="Revenue range" value={editForm.revenue_range} onChange={(value) => setEditForm({ ...editForm, revenue_range: value })} />
            <EditField label="Email" value={editForm.email} onChange={(value) => setEditForm({ ...editForm, email: value })} />
            <EditField label="Phone" value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
            <EditField label="Description" value={editForm.business_description} onChange={(value) => setEditForm({ ...editForm, business_description: value })} multiline />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DetailRow label="NAICS codes" value={formatCodeList(enterprise.naicsCodes, "naics")} />
              <DetailRow label="UNSPSC codes" value={formatCodeList(enterprise.unspscCodes, "unspsc")} />
              <DetailRow label="Employees" value={enterprise.employeeRange} />
              <DetailRow label="Revenue range" value={enterprise.revenueRange} />
            </div>
            <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted)]">Description</p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--foreground)]">{enterprise.description || "Not provided"}</p>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-[color:var(--foreground)]">
            <FileCheck2 size={17} /> Verification status
          </h2>
          <div className="mt-4 grid gap-3">
            <p className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-sm">
              <span className="text-[color:var(--muted)]">Documents</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--foreground)]">
                {profile.verification?.documentVerified ? <CheckCircle2 size={14} className="text-emerald-600" /> : null}
                {profile.verification?.documentVerified ? "Verified" : "Pending"}
              </span>
            </p>
            <p className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-sm">
              <span className="text-[color:var(--muted)]">Webcam ID</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--foreground)]">
                {profile.verification?.identityVerified ? <CheckCircle2 size={14} className="text-emerald-600" /> : null}
                {profile.verification?.identityVerified ? "Verified" : "Pending"}
              </span>
            </p>
            <p className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--card-muted)] px-3 py-2 text-sm">
              <span className="text-[color:var(--muted)]">Trust score</span>
              <span className="font-semibold text-[color:var(--foreground)]">{profile.verification?.trustScore ?? "Pending"}</span>
            </p>
          </div>
          {profile.status === "registered" ? (
            <button type="button" onClick={continueSelfVerification} className="btn-blue mt-4 inline-flex gap-2 px-4 py-2 text-sm">
              Continue self verification <ShieldCheck size={15} />
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-[color:var(--foreground)]">
            <BadgeCheck size={17} /> Certificate
          </h2>
          {profile.certificate ? (
            <div className="mt-4 space-y-3">
              <DetailRow label="Certificate id" value={profile.certificate.id} />
              {hasProvisionalCertificate ? <DetailRow label="Status" value="Provisional pending supplier-admin approval" /> : null}
              <DetailRow label="Valid through" value={formatDate(profile.certificate.validTill)} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={downloadCertificate} className="btn-blue inline-flex justify-center gap-2 px-4 py-2 text-sm">
                  <Download size={15} /> {hasProvisionalCertificate ? "Download provisional certificate" : "Download certificate"}
                </button>
                {!hasProvisionalCertificate ? (
                  <Link href={profile.certificate.verifyPath} className="btn-outline inline-flex justify-center gap-2 px-4 py-2 text-sm">
                    Verify public page
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
              A provisional certificate will appear after paid digital certification is submitted.
            </p>
          )}
        </div>
      </section>

      {isSelfVerified || isDigitalPending ? (
        <section className="rounded-lg border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-blue-900">
            <ShieldCheck size={17} /> Paid Digital Certification
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            {isDigitalPending
              ? "Your paid digital certification request is under supplier-admin review. A blockchain-backed certificate is issued only after approval; rejected requests are refunded."
              : "Recommended next step: submit a paid digital certification request for a 72-hour authenticity review."}
          </p>
          {isDigitalPending && profile.review?.additionalInfoRequests?.length ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-bold">Supplier admin requested more information</p>
              <div className="mt-2 space-y-1 text-xs leading-5">
                {profile.review.additionalInfoRequests.map((request) => (
                  <p key={request}>{request}</p>
                ))}
              </div>
            </div>
          ) : null}
          {!isDigitalPending ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <input className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 lg:col-span-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              <input className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 lg:col-span-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <input className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" />
              <input className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" />
              <input className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" />
              <button
                type="button"
                onClick={submitDigitalRequest}
                disabled={!cardValid || submitting || !email.trim() || !phone.trim()}
                className="btn-blue inline-flex justify-center gap-2 px-4 py-2 text-sm disabled:opacity-45 lg:col-span-2"
              >
                <CreditCard size={15} /> Pay ${profile.payment?.amountUsd ?? 100} and submit
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {isDigitalCertified ? (
        <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-[color:var(--foreground)]">
            <CalendarClock size={17} /> Renewal payment
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Digital certification is valid through {formatDate(profile.review?.validTill)}. Use this payment option to schedule the next renewal cycle.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <input className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--border-strong)]" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" />
            <input className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--border-strong)]" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" />
            <input className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--border-strong)]" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" />
            <button
              type="button"
              onClick={submitRenewalPayment}
              disabled={!cardValid || submitting}
              className="btn-purple inline-flex justify-center gap-2 px-4 py-2 text-sm disabled:opacity-45 lg:col-span-2"
            >
              <RefreshCcw size={15} /> Pay renewal ${profile.review?.renewalAmountUsd ?? 100}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

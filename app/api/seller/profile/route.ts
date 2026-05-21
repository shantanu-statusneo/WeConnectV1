import { NextResponse } from "next/server";
import { deleteSession, listCertificates, listSessions, getSession } from "@/lib/session-store";
import { deleteDomainState, getDomainState, type DomainState } from "@/lib/store/domain-store";
import { removeCatalogSupplier } from "@/lib/store/buyer-catalog";
import type { CertificateRecord } from "@/lib/types";
import type { RegistrationDraft } from "@/lib/registration";

type SellerProfileStatus =
  | "not_registered"
  | "registered"
  | "self_verified"
  | "digital_pending"
  | "digital_certified";

function addYears(value: string, years: number) {
  const date = new Date(value);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

function ownerLabel(registration?: RegistrationDraft) {
  return registration?.owner_details
    .map((owner) => owner.fullName)
    .filter(Boolean)
    .join(", ") || "";
}

function cleanLower(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasRegisteredEnterprise(registration?: RegistrationDraft) {
  return Boolean(registration?.business_name.trim());
}

function resolveStatus(
  session: { stage: string; aiAssessmentReport?: { documents?: { verified: boolean } }; visionChecks?: { idPassed?: boolean } },
  registration: RegistrationDraft | undefined,
  workflow: DomainState,
  certificate: CertificateRecord | null,
): SellerProfileStatus {
  if (!registration?.business_name.trim()) return "not_registered";
  if (!certificate) {
    if (workflow.certificationType === "digital" || workflow.payment.state === "hold_placed") {
      return "digital_pending";
    }
    const selfVerificationComplete =
      Boolean(session.aiAssessmentReport?.documents?.verified) &&
      (Boolean(session.visionChecks?.idPassed) || session.stage === "voice_attestation");
    if (selfVerificationComplete) return "self_verified";
    return "registered";
  }
  if (certificate.provenanceSummary?.certificateKind === "provisional") return "digital_pending";
  const issuedAsDigital = certificate.provenanceSummary?.certType === "digital";
  const workflowSaysDigitalCertified =
    workflow.certificationType === "digital" &&
    workflow.verificationStatus === "passed" &&
    workflow.payment.state === "captured";
  if (issuedAsDigital || workflowSaysDigitalCertified) return "digital_certified";
  if (workflow.certificationType === "digital" && workflow.payment.state === "hold_placed") {
    return "digital_pending";
  }
  return "self_verified";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const preferredSessionId = searchParams.get("sessionId")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();
  const companyName = searchParams.get("companyName")?.trim().toLowerCase();

  const sessions = listSessions();
  const preferred = preferredSessionId ? getSession(preferredSessionId) : undefined;
  const hasProfileIdentifier = Boolean(preferredSessionId || email || companyName);
  const session =
    preferred ??
    sessions.find((candidate) => email && cleanLower(candidate.registration?.email) === email) ??
    sessions.find((candidate) => companyName && cleanLower(candidate.registration?.business_name) === companyName) ??
    (hasProfileIdentifier ? undefined : sessions.find((candidate) => hasRegisteredEnterprise(candidate.registration)));

  if (!session?.registration || !hasRegisteredEnterprise(session.registration)) {
    return NextResponse.json({
      ok: true,
      profile: {
        status: "not_registered" satisfies SellerProfileStatus,
      },
    });
  }

  const workflow = getDomainState(session.id);
  const certificate =
    listCertificates()
      .filter((cert) => cert.sessionId === session.id && !cert.revoked)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0] ?? null;
  const status = resolveStatus(session, session.registration, workflow, certificate);
  const validTill = certificate
    ? workflow.governance.validTill ?? addYears(certificate.issuedAt, 3)
    : workflow.governance.validTill;

  return NextResponse.json({
    ok: true,
    profile: {
      status,
      sessionId: session.id,
      stage: session.stage,
      registration: session.registration,
      enterprise: {
        businessName: session.registration.business_name,
        country: session.registration.country,
        companyType: session.registration.company_type,
        ownerNames: ownerLabel(session.registration),
        employeeRange: session.registration.num_employees,
        revenueRange: session.registration.revenue_range,
        naicsCodes: session.registration.naics_codes,
        unspscCodes: session.registration.unspsc_codes,
        designations: session.registration.designations,
        description: session.registration.business_description,
        email: session.registration.email,
        phone: session.registration.phone,
      },
      certificate: certificate
        ? {
            id: certificate.id,
            companyName: certificate.companyName,
            primaryOwner: certificate.primaryOwner,
            ownershipFemalePct: certificate.ownershipFemalePct,
            issuedAt: certificate.issuedAt,
            txHash: certificate.txHash,
            provenanceSummary: certificate.provenanceSummary,
            validTill,
            certificationType: status === "digital_certified" ? "digital" : "self",
            downloadPath: `/api/certificate/${certificate.id}/document`,
            verifyPath: `/verify/${certificate.id}`,
          }
        : null,
      verification: {
        documentVerified: Boolean(session.aiAssessmentReport?.documents?.verified),
        identityVerified: Boolean(session.visionChecks?.idPassed),
        trustScore: workflow.trustReport?.trustScore,
        riskLevel: workflow.trustReport?.riskLevel,
      },
      payment: workflow.payment,
      review: {
        validTill,
        digitalReviewSlaHours: 72,
        renewalAmountUsd: workflow.payment.amountUsd,
        additionalInfoRequests: workflow.governance.notifications.filter((notification) =>
          notification.includes("Supplier admin requested additional information"),
        ),
      },
    },
  });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    email?: string;
    companyName?: string;
  };
  const preferredSessionId = (body.sessionId ?? searchParams.get("sessionId"))?.trim();
  const email = (body.email ?? searchParams.get("email"))?.trim().toLowerCase();
  const companyName = (body.companyName ?? searchParams.get("companyName"))?.trim().toLowerCase();

  const sessions = listSessions();
  const preferred = preferredSessionId ? getSession(preferredSessionId) : undefined;
  const session =
    preferred ??
    sessions.find((candidate) => email && cleanLower(candidate.registration?.email) === email) ??
    sessions.find((candidate) => companyName && cleanLower(candidate.registration?.business_name) === companyName);

  if (!session?.id) {
    return NextResponse.json({ ok: true, deleted: false });
  }

  const certificateIds = listCertificates()
    .filter((cert) => cert.sessionId === session.id)
    .map((cert) => cert.id);
  deleteSession(session.id);
  deleteDomainState(session.id);
  removeCatalogSupplier(`draft-${session.id}`);
  for (const certId of certificateIds) removeCatalogSupplier(`live-${certId}`);

  return NextResponse.json({ ok: true, deleted: true, sessionId: session.id });
}

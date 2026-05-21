import { NextResponse } from "next/server";
import {
  CertificateIssuanceError,
  issueBlockchainBackedCertificate,
} from "@/lib/certificate-issuance";
import { listCertificates, listSessions, revokeCertificate } from "@/lib/session-store";
import { getDomainState, patchDomainState, pushGovernanceNotification } from "@/lib/store/domain-store";
import { removeCatalogSupplier } from "@/lib/store/buyer-catalog";

export async function GET() {
  const requests = listSessions()
    .map((session) => {
      const workflow = getDomainState(session.id);
      const registration = session.registration;
      const isDigitalRequest =
        registration?.cert_type === "digital" ||
        workflow.certificationType === "digital" ||
        workflow.payment.state === "hold_placed";
      const hasSellerSubmittedRequest =
        isDigitalRequest &&
        registration?.business_name?.trim() &&
        workflow.payment.state !== "captured" &&
        workflow.payment.state !== "refunded";

      if (!hasSellerSubmittedRequest || !registration) return null;

      return {
        id: `draft-${session.id}`,
        sessionId: session.id,
        businessName: registration.business_name,
        country: registration.country || "Unknown",
        email: registration.email,
        phone: registration.phone,
        companyType: registration.company_type,
        employeeRange: registration.num_employees,
        revenueRange: registration.revenue_range,
        womenOwned: registration.women_owned,
        ownerDetails: registration.owner_details,
        designations: registration.designations,
        additionalCerts: registration.additional_certs,
        paymentState: workflow.payment.state,
        paymentAmountUsd: workflow.payment.amountUsd,
        certificationStage: workflow.certificationStage,
        verificationStatus: workflow.verificationStatus,
        industryCodes: registration.naics_codes.length ? registration.naics_codes : ["54"],
        categoryCodes: registration.unspsc_codes.length ? registration.unspsc_codes : ["80000000"],
        trustScore: workflow.trustReport?.trustScore ?? (session.aiAssessmentReport?.overall.score || 82),
        lastVerified: new Date(session.updatedAt).toISOString().slice(0, 10),
        businessSummary:
          registration.business_description ||
          `${registration.business_name} submitted a digital certification request for supplier-admin review.`,
        documentAssessment: session.aiAssessmentReport?.documents
          ? {
              submittedCount: session.aiAssessmentReport.documents.submittedCount,
              verified: session.aiAssessmentReport.documents.verified,
              confidence: session.aiAssessmentReport.documents.confidence,
              summary: session.aiAssessmentReport.documents.summary,
              checkedAt: session.aiAssessmentReport.documents.checkedAt,
              submittedRequirementIds: session.aiAssessmentReport.documents.submittedRequirementIds ?? [],
              requiredDocumentIds: session.aiAssessmentReport.documents.requiredDocumentIds ?? [],
            }
          : null,
        identityAssessment: {
          idPassed: Boolean(session.visionChecks?.idPassed),
          idConfidence: session.visionChecks?.idConfidence,
        },
        uploadedDocuments: session.uploadedDocuments ?? [],
        adminNotes: workflow.governance.notifications.filter((notification) =>
          notification.includes("Supplier admin requested additional information"),
        ),
      };
    })
    .filter((request): request is NonNullable<typeof request> => Boolean(request));

  return NextResponse.json({ ok: true, requests });
}

function sessionIdFromRequestId(id: string): string | null {
  return id.startsWith("draft-") ? id.slice("draft-".length) : null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    requestId?: string;
    action?: "approve" | "reject" | "request_info";
    reason?: string;
  };
  if (!body.requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject" && body.action !== "request_info") {
    return NextResponse.json({ error: "action must be approve, reject, or request_info" }, { status: 400 });
  }
  const sessionId = sessionIdFromRequestId(body.requestId);
  if (!sessionId) {
    return NextResponse.json({ error: "request is not linked to a seller session" }, { status: 400 });
  }

  if (body.action === "request_info") {
    patchDomainState(sessionId, {
      verificationStatus: "manual_review",
    });
    pushGovernanceNotification(
      sessionId,
      `Supplier admin requested additional information${body.reason ? `: ${body.reason}` : ""}`,
    );
    return NextResponse.json({ ok: true, action: "request_info" });
  }

  if (body.action === "reject") {
    const workflow = getDomainState(sessionId);
    patchDomainState(sessionId, {
      payment: {
        ...workflow.payment,
        state: "refunded",
        refundAt: new Date().toISOString(),
      },
      verificationStatus: "failed",
    });
    for (const cert of listCertificates().filter(
      (candidate) =>
        candidate.sessionId === sessionId &&
        !candidate.revoked &&
        candidate.provenanceSummary?.certificateKind === "provisional",
    )) {
      revokeCertificate(cert.id, "Supplier admin rejected digital certification request");
    }
    removeCatalogSupplier(body.requestId);
    pushGovernanceNotification(
      sessionId,
      `Supplier admin rejected digital certification request${body.reason ? `: ${body.reason}` : ""}; payment refunded`,
    );
    return NextResponse.json({ ok: true, action: "reject" });
  }

  try {
    const result = await issueBlockchainBackedCertificate(sessionId, { requireDigitalApproval: true });
    removeCatalogSupplier(body.requestId);
    return NextResponse.json({ ok: true, action: "approve", ...result });
  } catch (error) {
    if (error instanceof CertificateIssuanceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { getSession, getSessionRegistration, setSessionPaid, setSessionRegistration } from "@/lib/session-store";
import {
  selectCertificationType,
  transitionPayment,
  updateCertificationStage,
  updateQuestionnaireAnswers,
} from "@/lib/domains/workflow";
import { getDomainState } from "@/lib/store/domain-store";
import type { CertificationStage, CertificationType, PaymentState } from "@/lib/domains/contracts";
import { emptyRegistrationDraft } from "@/lib/registration";
import { CertificateIssuanceError, issueProvisionalDigitalCertificate } from "@/lib/certificate-issuance";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId?: string;
    action?:
      | "select_certification_type"
      | "update_stage"
      | "update_questionnaire"
      | "payment_transition";
    certificationType?: CertificationType;
    stage?: CertificationStage;
    paymentState?: PaymentState;
    questionnaireAnswers?: Record<string, string>;
  };

  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const session = getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  let next = getDomainState(body.sessionId);

  if (body.action === "select_certification_type") {
    const certificationType = body.certificationType ?? "none";
    next = selectCertificationType(body.sessionId, certificationType);
    const currentRegistration = getSessionRegistration(body.sessionId) ?? emptyRegistrationDraft();
    setSessionRegistration(body.sessionId, {
      ...currentRegistration,
      cert_type: certificationType,
    });
  } else if (body.action === "update_stage" && body.stage) {
    next = updateCertificationStage(body.sessionId, body.stage);
  } else if (body.action === "update_questionnaire") {
    next = updateQuestionnaireAnswers(body.sessionId, body.questionnaireAnswers ?? {});
  } else if (body.action === "payment_transition" && body.paymentState) {
    next = transitionPayment(body.sessionId, body.paymentState);
    if (body.paymentState === "hold_placed" || body.paymentState === "captured") {
      setSessionPaid(body.sessionId, true);
    }
    const registration = getSessionRegistration(body.sessionId);
    if (body.paymentState === "hold_placed" && registration?.cert_type === "digital") {
      try {
        issueProvisionalDigitalCertificate(body.sessionId);
      } catch (error) {
        if (error instanceof CertificateIssuanceError) {
          return NextResponse.json(error.payload, { status: error.status });
        }
        throw error;
      }
    }
  }

  return NextResponse.json({ ok: true, workflow: next });
}

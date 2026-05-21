import { NextResponse } from "next/server";
import {
  appendTerminal,
  getSession,
  setSessionUploadedDocuments,
  upsertSessionAiDocumentAssessment,
} from "@/lib/session-store";
import { patchDomainState } from "@/lib/store/domain-store";
import { runDocumentVerification } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      documents?: Array<{
        base64: string;
        mimeType: string;
        requirementId?: string;
        requirementLabel?: string;
        fileName?: string;
      }>;
      checklist?: {
        countryGroup?: string;
        certificationPath?: string;
        requiredDocumentIds?: string[];
      };
    };

    const sessionId = body.sessionId;
    const documents = body.documents || [];

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    if (!documents.length) {
      return NextResponse.json({ error: "No documents provided" }, { status: 400 });
    }

    if (documents.length > 3) {
      return NextResponse.json({ error: "Maximum 3 documents allowed" }, { status: 400 });
    }

    const session = getSession(sessionId);
    const registration = session?.registration;
    if (!registration) {
      return NextResponse.json({ error: "Registration session not found" }, { status: 404 });
    }

    appendTerminal(sessionId, `[DOC_UPLOAD] Starting AI extraction/verification for ${documents.length} files...`);
    setSessionUploadedDocuments(
      sessionId,
      documents.map((document) => ({
        requirementId: document.requirementId,
        requirementLabel: document.requirementLabel,
        fileName: document.fileName,
        mimeType: document.mimeType,
      })),
    );

    const result = await runDocumentVerification(registration, documents, session?.companySnapshot);

    appendTerminal(
      sessionId,
      `[DOC_VERIFY] verified=${result.verified} confidence=${result.confidence}% signals="${result.matchedSignals?.join(", ") ?? "none"}" report="${result.report}"`
    );
    upsertSessionAiDocumentAssessment(sessionId, {
      submittedCount: documents.length,
      verified: result.verified,
      confidence: result.confidence,
      summary: result.report,
      countryGroup: body.checklist?.countryGroup,
      certificationPath: body.checklist?.certificationPath,
      submittedRequirementIds: documents.map((doc) => doc.requirementId).filter((id): id is string => Boolean(id)),
      requiredDocumentIds: body.checklist?.requiredDocumentIds,
      checkedAt: new Date().toISOString(),
    });
    const refreshed = getSession(sessionId)?.aiAssessmentReport;
    if (refreshed) {
      patchDomainState(sessionId, {
        aiAssessmentSummary: {
          status: refreshed.overall.status,
          score: refreshed.overall.score,
          updatedAt: refreshed.generatedAt,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

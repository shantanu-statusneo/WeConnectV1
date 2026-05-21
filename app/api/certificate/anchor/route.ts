import { NextResponse } from "next/server";
import {
  CertificateIssuanceError,
  issueBlockchainBackedCertificate,
} from "@/lib/certificate-issuance";
import { ensureSession } from "@/lib/session-store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId?: string;
  };
  const sessionId = body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  ensureSession(sessionId);

  try {
    const result = await issueBlockchainBackedCertificate(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CertificateIssuanceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }
    throw error;
  }
}

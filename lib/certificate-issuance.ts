import {
  AnchorSubmissionError,
  createDemoAnchorResult,
  getBlockchainHealth,
  submitAnchorTx,
  type AnchorSubmissionResult,
  type ChainFailureCode,
} from "@/lib/blockchain";
import { trustLevelFromCertification } from "@/lib/domains/contracts";
import { generateTrustReport } from "@/lib/domains/trust-report";
import { getCompanyById } from "@/lib/registry";
import {
  appendTerminal,
  getSession,
  issueCertificate,
  listCertificates,
  setSessionAnchorError,
  setSessionStage,
  type SessionRecord,
} from "@/lib/session-store";
import { upsertCertifiedSupplierFromSession } from "@/lib/store/buyer-catalog";
import { getDomainState, patchDomainState, pushGovernanceNotification } from "@/lib/store/domain-store";
import type { CertificateRecord, RegistryCompany } from "@/lib/types";
import { verificationReadiness } from "@/lib/verification-readiness";

export class CertificateIssuanceError extends Error {
  status: number;
  payload: Record<string, unknown>;

  constructor(status: number, payload: Record<string, unknown>) {
    super(typeof payload.error === "string" ? payload.error : "certificate issuance failed");
    this.status = status;
    this.payload = payload;
  }
}

function anchorHint(reasonCode: ChainFailureCode): string {
  switch (reasonCode) {
    case "config_invalid":
      return "Check CHAIN_RPC_URL, CHAIN_PRIVATE_KEY, and CHAIN_ID configuration.";
    case "insufficient_funds":
      return "Fund the anchoring wallet on Base Sepolia for gas and retry.";
    case "rpc_unreachable":
      return "RPC is unreachable. Verify provider endpoint/network and retry.";
    case "network_timeout":
      return "Chain confirmation timed out. Retry or use a more reliable RPC provider.";
    case "tx_reverted":
      return "Transaction reverted on-chain. Verify contract/network parameters.";
    case "tx_rejected":
      return "Transaction rejected (nonce/fee/user). Retry after checking wallet state.";
    case "receipt_invalid":
      return "Invalid receipt returned by provider. Retry and check RPC health.";
    default:
      return "Unknown chain error. Inspect server logs and provider diagnostics.";
  }
}

function extractTxHashFromDetail(detail: string): string | null {
  const match = detail.match(/0x[0-9a-fA-F]{64}/);
  return match?.[0] ?? null;
}

function companyForSession(session: SessionRecord): RegistryCompany | null {
  return session.companyId
    ? (getCompanyById(session.companyId) ?? session.companySnapshot ?? null)
    : (session.companySnapshot ?? null);
}

function latestActiveCertificate(sessionId: string, kind?: "provisional" | "blockchain_backed") {
  return (
    listCertificates()
      .filter((cert) => {
        if (cert.sessionId !== sessionId || cert.revoked) return false;
        return kind ? cert.provenanceSummary?.certificateKind === kind : true;
      })
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0] ?? null
  );
}

export function issueProvisionalDigitalCertificate(sessionId: string): CertificateRecord {
  const session = getSession(sessionId);
  if (!session) {
    throw new CertificateIssuanceError(404, { error: "session not found" });
  }
  const company = companyForSession(session);
  if (!company) {
    throw new CertificateIssuanceError(400, { error: "no company on session" });
  }
  const workflow = getDomainState(sessionId);
  const hasPaidForDigital = session.registration?.cert_type === "digital" && (session.paid || workflow.payment.state === "hold_placed");
  if (!hasPaidForDigital) {
    throw new CertificateIssuanceError(400, {
      error: "digital certification payment required",
      blockers: ["paid"],
    });
  }

  const issuedAt = new Date().toISOString();
  patchDomainState(sessionId, {
    certificationType: "digital",
    certificationStage: "digital_verification",
    verificationStatus: "manual_review",
    trustLevel: "self_certified",
    payment: {
      ...workflow.payment,
      state: workflow.payment.state === "captured" ? "captured" : "hold_placed",
      holdAt: workflow.payment.holdAt ?? issuedAt,
    },
  });

  const existing = latestActiveCertificate(sessionId, "provisional");
  if (existing) return existing;

  const cert = issueCertificate(sessionId, {
    sessionId,
    txHash: `provisional:${sessionId}:${Date.now()}`,
    companyName: company.companyName,
    primaryOwner: company.primaryOwner,
    ownershipFemalePct: company.ownershipFemalePct,
    issuedAt,
    attestationSummary: "Paid digital certification request accepted for supplier-admin review.",
    manualReviewSuggested: true,
    provenanceSummary: {
      certificateKind: "provisional",
      certType: "digital_provisional",
      paidAtIssuance: true,
      discoveryProvider: session.discoveryMeta?.provider,
      selectedCandidateTitle: session.selectedCandidate?.title,
      visionIdPassed: session.visionChecks?.idPassed,
      ownershipEvidenceSource: session.discoveryMeta?.provider ? "prefill_web" : "prefill_registry",
      ownershipVisionVerified: false,
      readinessBlockers: [],
    },
  });

  pushGovernanceNotification(sessionId, "Provisional digital certificate issued after payment; supplier-admin approval pending");
  appendTerminal(sessionId, `[CERTIFICATE] id=${cert.id} PROVISIONAL_DIGITAL_ISSUED`);
  return cert;
}

export async function issueBlockchainBackedCertificate(sessionId: string, options?: { requireDigitalApproval?: boolean }) {
  const session = getSession(sessionId);
  if (!session) {
    throw new CertificateIssuanceError(404, { error: "session not found" });
  }
  const company = companyForSession(session);
  if (!company) {
    throw new CertificateIssuanceError(400, { error: "no company on session" });
  }
  const workflow = getDomainState(sessionId);
  const resolvedCertificationType =
    workflow.certificationType === "none"
      ? ((session.registration?.cert_type as "self" | "digital" | undefined) ?? "self")
      : workflow.certificationType;

  if (resolvedCertificationType !== "digital") {
    throw new CertificateIssuanceError(400, {
      error: "self verification no longer issues certificates",
      blockers: ["digital_certification_payment"],
    });
  }
  if (!options?.requireDigitalApproval) {
    throw new CertificateIssuanceError(403, {
      error: "supplier-admin approval required before issuing a blockchain-backed certificate",
      blockers: ["supplier_admin_approval"],
    });
  }
  if (resolvedCertificationType === "digital" && workflow.payment.state !== "hold_placed") {
    throw new CertificateIssuanceError(400, {
      error: "supplier-admin approval requires a paid digital certification request",
      blockers: ["paid"],
    });
  }

  const readiness = verificationReadiness(session);
  if (!readiness.isReady) {
    throw new CertificateIssuanceError(400, {
      error: "verification not ready",
      blockers: readiness.blockers,
    });
  }

  setSessionStage(sessionId, "anchoring");
  appendTerminal(sessionId, "[QID_CHAIN] anchoring_soulbound_token start");
  const chainHealth = getBlockchainHealth();
  appendTerminal(
    sessionId,
    `[QID_CHAIN] config mode=${chainHealth.mode} chainId=${chainHealth.chainId} rpc_configured=${chainHealth.rpcConfigured} private_key_valid=${chainHealth.privateKeyValid} contract_configured=${chainHealth.contractConfigured}`,
  );
  const issuedAt = new Date().toISOString();
  let anchorResult: AnchorSubmissionResult;
  try {
    anchorResult = await submitAnchorTx({
      sessionId,
      companyName: company.companyName,
      certType: session.registration?.cert_type,
      issuedAtIso: issuedAt,
    });
  } catch (error) {
    const reasonCode: ChainFailureCode =
      error instanceof AnchorSubmissionError ? error.code : "unknown";
    const reasonDetail =
      error instanceof AnchorSubmissionError
        ? error.detail
        : error instanceof Error
          ? error.message
          : "chain submission failed";
    const operatorHint = anchorHint(reasonCode);
    const diagnostics = error instanceof AnchorSubmissionError ? error.diagnostics : undefined;
    appendTerminal(sessionId, "[QID_CHAIN] mode=real");
    appendTerminal(sessionId, `[QID_CHAIN] error_code=${reasonCode}`);
    appendTerminal(sessionId, `[QID_CHAIN] error_detail=${reasonDetail}`);
    if (diagnostics) {
      appendTerminal(
        sessionId,
        `[QID_CHAIN] diagnostics attempt=${diagnostics.attemptId} stage=${diagnostics.stage} elapsed_ms=${diagnostics.elapsedMs ?? "n/a"} rpc_host=${diagnostics.rpcHost ?? "n/a"} kind=${diagnostics.anchorKind ?? "n/a"}`,
      );
    }
    const errorTxHash = extractTxHashFromDetail(reasonDetail);
    if (errorTxHash) {
      appendTerminal(sessionId, `[QID_CHAIN] error_tx_hash=${errorTxHash}`);
    }
    appendTerminal(sessionId, `[QID_CHAIN] operator_hint=${operatorHint}`);
    console.error("[QID_CHAIN] anchor_failed", {
      sessionId,
      reasonCode,
      reasonDetail,
      diagnostics,
      stack: error instanceof Error ? error.stack : undefined,
    });
    setSessionAnchorError(sessionId, {
      at: new Date().toISOString(),
      reasonCode,
      reasonDetail,
      operatorHint,
    });
    anchorResult = createDemoAnchorResult(`real_chain_failed:${reasonCode}`, diagnostics);
    appendTerminal(sessionId, `[QID_CHAIN] fallback_to_demo reason=${reasonCode}`);
  }

  appendTerminal(sessionId, `[QID_CHAIN] mode=${anchorResult.mode}`);
  appendTerminal(sessionId, `[QID_CHAIN] anchor_kind=${anchorResult.anchorKind}`);
  appendTerminal(sessionId, `[QID_CHAIN] tx_submitted hash=${anchorResult.txHash.slice(0, 10)}...`);
  appendTerminal(sessionId, `[QID_CHAIN] digest=${anchorResult.digest.slice(0, 14)}...`);
  if (anchorResult.diagnostics) {
    appendTerminal(
      sessionId,
      `[QID_CHAIN] diagnostics attempt=${anchorResult.diagnostics.attemptId} stage=${anchorResult.diagnostics.stage} elapsed_ms=${anchorResult.diagnostics.elapsedMs ?? "n/a"} rpc_host=${anchorResult.diagnostics.rpcHost ?? "n/a"}`,
    );
  }
  if (anchorResult.contractAddress) {
    appendTerminal(sessionId, `[QID_CHAIN] contract=${anchorResult.contractAddress}`);
  }
  if (anchorResult.reason) {
    appendTerminal(sessionId, `[QID_CHAIN] fallback_reason=${anchorResult.reason}`);
  }

  for (const cert of listCertificates().filter(
    (candidate) =>
      candidate.sessionId === sessionId &&
      !candidate.revoked &&
      candidate.provenanceSummary?.certificateKind === "provisional",
  )) {
    cert.revoked = true;
    cert.revokedReason = "Replaced by supplier-admin approved blockchain-backed certificate";
  }

  const cert = issueCertificate(sessionId, {
    sessionId,
    txHash: anchorResult.txHash,
    companyName: company.companyName,
    primaryOwner: company.primaryOwner,
    ownershipFemalePct: company.ownershipFemalePct,
    issuedAt,
    attestationSummary: session.attestation?.rationale,
    manualReviewSuggested: session.attestation?.manualReview,
    provenanceSummary: {
      certificateKind: "blockchain_backed",
      certType: resolvedCertificationType,
      paidAtIssuance: readiness.paid,
      discoveryProvider: session.discoveryMeta?.provider,
      selectedCandidateTitle: session.selectedCandidate?.title,
      visionIdPassed: session.visionChecks?.idPassed,
      ownershipEvidenceSource: session.discoveryMeta?.provider ? "prefill_web" : "prefill_registry",
      ownershipVisionVerified: false,
      anchorMode: anchorResult.mode,
      anchorFallbackReason: anchorResult.reason,
      anchorKind: anchorResult.anchorKind,
      anchorContractAddress: anchorResult.contractAddress,
      anchorDigest: anchorResult.digest,
      readinessBlockers: [],
    },
  });

  const report = generateTrustReport(sessionId, session);
  const validTillIso = new Date(new Date(issuedAt).setFullYear(new Date(issuedAt).getFullYear() + 3)).toISOString();
  const shouldCapturePayment = resolvedCertificationType === "digital";
  patchDomainState(sessionId, {
    trustLevel: trustLevelFromCertification(resolvedCertificationType),
    certificationType: resolvedCertificationType,
    certificationStage: "completed",
    verificationStatus: "passed",
    trustReport: report,
    payment: {
      ...workflow.payment,
      state: workflow.payment.state === "refunded" ? "refunded" : shouldCapturePayment ? "captured" : workflow.payment.state,
      captureAt: shouldCapturePayment ? new Date().toISOString() : workflow.payment.captureAt,
    },
    governance: {
      ...workflow.governance,
      validTill: validTillIso,
      notifications: workflow.governance.notifications,
      auditTrail: workflow.governance.auditTrail,
    },
  });
  pushGovernanceNotification(
    sessionId,
    shouldCapturePayment
      ? "Supplier admin approved digital certification; payment captured and blockchain certificate issued"
      : "Certification approved (no payment capture required)",
  );
  upsertCertifiedSupplierFromSession({
    id: `live-${cert.id}`,
    businessName: company.companyName,
    country: session.registration?.country || "Unknown",
    naicsCodes: session.registration?.naics_codes ?? [],
    unspscCodes: session.registration?.unspsc_codes ?? [],
    designations: session.registration?.designations ?? [],
    certType: resolvedCertificationType,
    trustScore: report.trustScore,
    blockchainVerified: anchorResult.mode === "real",
    womenOwned: Boolean(session.registration?.women_owned),
    businessSummary: session.registration?.business_description,
    clientsWorkedWith: workflow.questionnaireAnswers.clients_worked_with,
    lastVerified: report.generatedAt,
  });

  setSessionStage(sessionId, "complete");
  setSessionAnchorError(sessionId, null);
  appendTerminal(sessionId, "[BUYER_PORTAL] certificate_active=true");
  appendTerminal(sessionId, `[CERTIFICATE] id=${cert.id} SBT_MINTED (supplier_admin_approved)`);

  return {
    certificate: cert,
    verifyPath: `/verify/${cert.id}`,
    anchorMode: anchorResult.mode,
    anchorFallbackReason: anchorResult.reason,
    anchorKind: anchorResult.anchorKind,
    anchorContractAddress: anchorResult.contractAddress,
    anchorDigest: anchorResult.digest,
  };
}

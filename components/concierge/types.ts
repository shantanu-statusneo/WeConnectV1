import { type CertificationType, type ComplianceResult, type TrustReport } from "@/lib/domains/contracts";
import { type RegistrationDraft, type FieldSource } from "@/lib/registration";
import { type CertDisplay } from "@/components/CertificateCard";

export type Match = {
  id: string;
  companyName: string;
  jurisdiction: string;
  registrySnippet: string;
  primaryOwner: string;
  ownershipFemalePct?: number | null;
  ownerPrefillPct?: number | null;
};

export type OwnershipSummary = {
  value?: number;
  sourceType?: "exact_exchange_filing" | "web_inferred" | "registry_prefill";
  confidence?: number;
  asOfDate?: string;
  sourceUrl?: string;
};

export type OwnershipBreakdown = {
  ownership_total_promoter_pct?: number;
  ownership_total_public_pct?: number;
  ownership_breakdown?: Array<{ category: string; pct: number }>;
  as_of_date?: string;
  source_url?: string;
  source_type?: "exchange_filing";
  exchange?: "NSE" | "BSE";
  symbol?: string;
};

export type AgentJson = {
  assistantText?: string;
  stage?: string;
  uiHints?: { badge?: string | null };
  quotaFallback?: boolean;
  fallbackReason?: "quota" | "api_key_invalid" | "model_not_found" | "permission" | "network" | "unknown";
  fallbackSubtype?: "capacity" | "quota";
  error?: string;
};

export type GeminiFallbackReason =
  | "quota"
  | "api_key_invalid"
  | "model_not_found"
  | "permission"
  | "network"
  | "unknown";
export type GeminiQuotaSubtype = "capacity" | "quota";

export type AnchorJson = {
  certificate?: CertDisplay & { revoked: boolean };
  blockers?: string[];
  error?: string;
  reasonCode?:
  | "config_invalid"
  | "rpc_unreachable"
  | "network_timeout"
  | "insufficient_funds"
  | "tx_reverted"
  | "tx_rejected"
  | "receipt_invalid"
  | "unknown";
  reasonDetail?: string;
  operatorHint?: string;
  anchorMode?: "real" | "demo";
  anchorFallbackReason?: string;
  diagnostics?: {
    attemptId?: string;
    stage?: string;
    rpcHost?: string;
    elapsedMs?: number;
  };
};

export type DiscoverJson = {
  ok: boolean;
  source?: "registry" | "web";
  provider?: "google_serpapi" | "duckduckgo";
  fallbackReason?: string;
  lowConfidence?: boolean;
  match?: Match;
  message?: string;
  candidates?: Array<{ title: string; snippet: string; url: string; domain?: string; score?: number }>;
  enrichmentSummary?: {
    legalName?: string;
    country?: string;
    ownerName?: string;
    founderNames?: string[];
    industryHint?: string;
    companyType?: string;
  };
  classificationSummary?: {
    naics?: { codes?: string[]; sourceType?: "authoritative" | "serp_explicit" | "inferred" | "unresolved"; confidence?: number };
    unspsc?: { codes?: string[]; sourceType?: "authoritative" | "serp_explicit" | "inferred" | "unresolved"; confidence?: number };
  };
  prefill?: RegistrationDraft;
  fieldConfidence?: Partial<Record<keyof RegistrationDraft, number>>;
  fieldSource?: Partial<Record<keyof RegistrationDraft, FieldSource>>;
  evidence?: Partial<Record<keyof RegistrationDraft, string>>;
  missingRequired?: string[];
  selectedCandidateIndex?: number;
  ownershipEvidenceConfidence?: number;
  countryRequiresConfirmation?: boolean;
  ownership?: OwnershipSummary;
  ownershipBreakdown?: OwnershipBreakdown;
  ownershipSourceType?: "exact_exchange_filing" | "web_inferred" | "registry_prefill";
  ownershipConfidence?: number;
};

export type WorkflowState = {
  trustLevel: "self_declared" | "self_certified" | "digitally_certified";
  certificationType: CertificationType;
  certificationStage: string;
  verificationStatus: "pending" | "running" | "passed" | "manual_review" | "failed";
  payment: {
    state: "not_started" | "hold_placed" | "captured" | "refunded";
    amountUsd: number;
    holdAt?: string;
    captureAt?: string;
    refundAt?: string;
  };
  questionnaireAnswers: Record<string, string>;
  compliance?: ComplianceResult;
  trustReport?: TrustReport;
  governance: {
    roles: Array<"supplier" | "buyer" | "admin">;
    notifications: string[];
    auditTrail: string[];
    validTill?: string;
    continuouslyMonitored: boolean;
  };
};

export type AiAssessmentReport = {
  version: string;
  generatedAt: string;
  mock: boolean;
  disclaimer: string;
  documents?: {
    submittedCount: number;
    verified: boolean;
    confidence: number;
    summary: string;
    countryGroup?: string;
    certificationPath?: string;
    submittedRequirementIds?: string[];
    requiredDocumentIds?: string[];
    checkedAt: string;
  };
  identity?: {
    idFaceMatch: boolean;
    matchScore: number;
    confidence: number;
    livenessHint?: string;
    nameGuess?: string;
    warningCode?: string;
    nameMatchBypassed?: boolean;
    checkedAt: string;
  };
  overall: {
    status: "partial" | "ready";
    score: number;
  };
};

export type BuyerFlowRow = {
  supplier: {
    id: string;
    business_name: string;
    country: string;
    cert_type: "none" | "self" | "digital" | "auditor";
    cert_status: string;
    trust_score: number;
  };
  profile: {
    trustLevel: "self_declared" | "self_certified" | "digitally_certified";
    trustScore: number;
    riskLevel: "low" | "medium" | "high";
    lastVerified: string;
  };
  match: {
    matchScore: number;
    certificationPriority: number;
    rankReason: string;
  };
};

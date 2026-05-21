"use client";

import { useState, useMemo } from "react";
import { emptyRegistrationDraft, validateRegistration } from "@/lib/registration";
import { getDocumentChecklist } from "@/lib/document-requirements";
import { type CertificationType, type ComplianceResult, type TrustReport } from "@/lib/domains/contracts";
import { getTranslations, getLanguageMetadata, type Language } from "@/lib/i18n";
import type { CertDisplay } from "@/components/CertificateCard";
import { BlockAnchorAnimation } from "./BlockAnchorAnimation";

// Concierge sub-components
import { Header } from "./concierge/Header";
import { IntroSection } from "./concierge/IntroSection";
import { IntakeSection } from "./concierge/IntakeSection";
import { StepperUI } from "./concierge/StepperUI";
import { RegistrationReview } from "./concierge/RegistrationReview";
import { VerificationDisplay } from "./concierge/VerificationDisplay";
import { CertificateDisplay } from "./concierge/CertificateDisplay";
import { UpgradePortal } from "./concierge/UpgradePortal";

// Concierge hooks
import { useSpeechSynthesis } from "./concierge/useSpeechSynthesis";
import { useConciergeSession } from "./concierge/useConciergeSession";
import { useConciergeWorkflow } from "./concierge/useConciergeWorkflow";
import { useDiscovery } from "./concierge/useDiscovery";
import { useVerification } from "./concierge/useVerification";
import { useAgent } from "./concierge/useAgent";
import { useAnchoring } from "./concierge/useAnchoring";
import { useReports } from "./concierge/useReports";
import { humanizeMissingField } from "./concierge/utils";

import { 
  GeminiFallbackReason, 
  GeminiQuotaSubtype, 
  WorkflowState, 
  AiAssessmentReport,
  Match,
  OwnershipSummary,
  OwnershipBreakdown,
  DiscoverJson
} from "./concierge/types";

type DisplayCertificate = CertDisplay & { revoked?: boolean };

export function ConciergeClient({ embed, language = "en" }: { embed?: boolean; language?: Language }) {
  const translations = getTranslations(language);
  const langMeta = getLanguageMetadata(language);
  
  // --- Local State ---
  const [query, setQuery] = useState(translations.intake.placeholder);
  const [stage, setStage] = useState<string>("idle");
  const [assistant, setAssistant] = useState<string>("");
  const [badge, setBadge] = useState<string | null>(null);
  const [cert, setCert] = useState<DisplayCertificate | null>(null);
  const [quotaFallbackNotice, setQuotaFallbackNotice] = useState(false);
  const [quotaFallbackReason, setQuotaFallbackReason] = useState<GeminiFallbackReason | null>(null);
  const [quotaFallbackSubtype, setQuotaFallbackSubtype] = useState<GeminiQuotaSubtype | null>(null);
  const [registration, setRegistration] = useState(emptyRegistrationDraft());
  const [paid, setPaid] = useState(false);
  const [visionChecks, setVisionChecks] = useState<{ idPassed?: boolean }>({});
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [aiAssessmentReport, setAiAssessmentReport] = useState<AiAssessmentReport | null>(null);
  const [, setCompliance] = useState<ComplianceResult | null>(null);
  const [, setTrustReport] = useState<TrustReport | null>(null);
  const [, setQuestionnaireAnswers] = useState<Record<string, string>>({
    ownership_control: "",
    operational_involvement: "",
    years_in_business: "",
    clients_worked_with: "",
    product_scale: "",
  });
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [manualFlowStep, setManualFlowStep] = useState<number | null>(null);

  // Discovery related states (shared)
  const [match, setMatch] = useState<Match | null>(null);
  const [fieldConfidence, setFieldConfidence] = useState<Partial<Record<string, number>>>({});
  const [fieldEvidence, setFieldEvidence] = useState<Partial<Record<string, string>>>({});
  const [discoverCandidates, setDiscoverCandidates] = useState<NonNullable<DiscoverJson["candidates"]>>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [needsCandidateConfirmation, setNeedsCandidateConfirmation] = useState(false);
  const [countryConfirmed, setCountryConfirmed] = useState(true);
  const [countryRequiresConfirmation, setCountryRequiresConfirmation] = useState(false);
  const [ownershipEvidenceConfidence, setOwnershipEvidenceConfidence] = useState(0);
  const [ownership, setOwnership] = useState<OwnershipSummary | null>(null);
  const [ownershipBreakdown, setOwnershipBreakdown] = useState<OwnershipBreakdown | null>(null);
  const [founderNames, setFounderNames] = useState<string[]>([]);
  const [, setClassificationSummary] = useState<DiscoverJson["classificationSummary"] | undefined>(undefined);

  // --- Hooks ---
  const { speak: speakWithLanguage } = useSpeechSynthesis(langMeta.langCode, audioEnabled);

  const { sessionId, saveRegistration, refreshSession } = useConciergeSession(
    match,
    registration, setRegistration,
    paid, setPaid,
    stage, setStage,
    setAssistant,
    visionChecks, setVisionChecks,
    setAiAssessmentReport,
    setWorkflow,
    setCompliance,
    setTrustReport,
    setQuestionnaireAnswers
  );

  const { setCertificationType, runCompliance, createTrustReport } = useConciergeWorkflow(
    sessionId, setWorkflow, setCompliance, setTrustReport, setAssistant, setBadge, setRegistration
  );

  const { runDiscover } = useDiscovery(
    sessionId, query, registration, setRegistration, workflow, setAssistant, speakWithLanguage, setBadge, refreshSession,
    match, setMatch,
    fieldConfidence, setFieldConfidence,
    fieldEvidence, setFieldEvidence,
    discoverCandidates, setDiscoverCandidates,
    selectedCandidateIndex, setSelectedCandidateIndex,
    needsCandidateConfirmation, setNeedsCandidateConfirmation,
    countryConfirmed, setCountryConfirmed,
    setCountryRequiresConfirmation,
    setOwnershipEvidenceConfidence,
    setOwnership,
    setOwnershipBreakdown,
    setFounderNames,
    setClassificationSummary
  );

  const verification = useVerification(
    sessionId, setAssistant, speakWithLanguage, setBadge, refreshSession, setStage, 
    (passed) => setVisionChecks((prev) => ({ ...prev, idPassed: passed })),
    workflow?.certificationType === "self" || registration.cert_type === "self",
    runCompliance, createTrustReport
  );

  const { callAgent } = useAgent(
    sessionId, setAssistant, speakWithLanguage, setBadge, setStage, refreshSession,
    setQuotaFallbackNotice, setQuotaFallbackReason, setQuotaFallbackSubtype
  );

  const { anchoring, anchorBlockers, anchorFailureReason, anchorOperatorHint, pendingTx, anchorCert } = useAnchoring(
    sessionId, registration, paid, saveRegistration, setCert, setStage, setBadge, refreshSession, speakWithLanguage
  );

  const reports = useReports(sessionId, cert, setAssistant);

  // --- Derived State ---
  const registrationCertType: CertificationType =
    registration.cert_type === "self" || registration.cert_type === "digital" ? registration.cert_type : "none";
  const activeCertType: CertificationType = workflow?.certificationType && workflow.certificationType !== "none"
    ? workflow.certificationType
    : registrationCertType;
  const isDigitalPath = activeCertType === "digital";
  const isSelfPath = activeCertType === "self";
  const requiresIdentityCheck = isDigitalPath;
  
  const registrationCheck = validateRegistration(registration, true);
  const readinessBlockers = [
    ...registrationCheck.missingRequired,
    ...(requiresIdentityCheck && !visionChecks.idPassed && stage !== "voice_attestation" ? ["vision_id"] : []),
  ];
  const countryConfirmationBlockers = countryRequiresConfirmation && !countryConfirmed ? ["country_confirmation"] : [];
  const mergedBlockers = Array.from(new Set([...readinessBlockers, ...countryConfirmationBlockers, ...anchorBlockers]));
  const readinessForIssue = mergedBlockers.length === 0;
  const documentChecklist = useMemo(
    () => getDocumentChecklist(registration.country, activeCertType === "none" ? "registration" : activeCertType),
    [registration.country, activeCertType],
  );
  const digitalDocumentsVerified =
    aiAssessmentReport?.documents?.verified &&
    aiAssessmentReport.documents.certificationPath === "digital";
  const digitalVerificationComplete =
    isDigitalPath &&
    Boolean(digitalDocumentsVerified) &&
    (Boolean(visionChecks.idPassed) || stage === "voice_attestation");

  const mockCardValid = cardNumber.replace(/\s+/g, "").length >= 12 && cardExpiry.trim().length >= 4 && cardCvv.length >= 3;

  const flowSteps = ["Supplier Registration", "Self Verification", "Digital Certification"] as const;
  const savedRegistrationMatch = useMemo<Match | null>(() => {
    if (!registration.business_name.trim()) return null;
    const ownerTotal = registration.owner_details.reduce((sum, owner) => sum + (owner.ownershipPct || 0), 0);
    return {
      id: `saved-${sessionId ?? registration.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      companyName: registration.business_name,
      jurisdiction: registration.country || "Saved supplier profile",
      registrySnippet: registration.business_description || "Loaded from saved supplier registration.",
      primaryOwner: registration.owner_details.map((owner) => owner.fullName).filter(Boolean).join(", ") || "Not provided",
      ownershipFemalePct: registration.women_owned ? (ownerTotal || 100) : ownerTotal || null,
      ownerPrefillPct: ownerTotal || null,
    };
  }, [registration, sessionId]);
  const effectiveMatch = match ?? savedRegistrationMatch;
  
  const computedFlowStep = useMemo(() => {
    if (!effectiveMatch) return 0;
    if (
      needsCandidateConfirmation ||
      !registration.country.trim() ||
      (countryRequiresConfirmation && !countryConfirmed) ||
      stage === "discovered" ||
      stage === "voice_confirm" ||
      stage === "idle"
    ) {
      return 0;
    }
    if (activeCertType === "digital" && paid && cert) return 2;
    return 1;
  }, [stage, activeCertType, paid, cert, effectiveMatch, needsCandidateConfirmation, registration.country, countryRequiresConfirmation, countryConfirmed]);

  const currentFlowStep = manualFlowStep ?? computedFlowStep;

  // --- Actions ---
  const resetRegistration = async () => {
    setManualFlowStep(null);
    setMatch(null);
    setCert(null);
    setRegistration(emptyRegistrationDraft());
    setNeedsCandidateConfirmation(false);
    setCountryConfirmed(true);
    setCountryRequiresConfirmation(false);
    setPaid(false);
    setStage("idle");
    await setCertificationType("none");
  };

  const confirmRegistration = async () => {
    if (needsCandidateConfirmation) {
      const msg = "Please select the best web candidate and click 'Use selected candidate' before confirming registration.";
      setAssistant(msg);
      speakWithLanguage(msg);
      return;
    }
    if (!registration.country.trim()) {
      const msg = "Country is required before verification. Please enter and confirm the country.";
      setAssistant(msg);
      speakWithLanguage(msg);
      return;
    }
    if (countryRequiresConfirmation && !countryConfirmed) {
      const msg = "Please confirm the country field before starting verification.";
      setAssistant(msg);
      speakWithLanguage(msg);
      return;
    }

    const check = validateRegistration(registration, true);
    if (check.missingRequired.length) {
      const missing = check.missingRequired.slice(0, 5).map(humanizeMissingField).join(", ");
      const msg = `Please complete registration details before self verification: ${missing}.`;
      setAssistant(msg);
      speakWithLanguage(msg);
      return;
    }

    const nextRegistration = { ...registration, cert_type: "self" };
    setRegistration(nextRegistration);
    setPaid(false);
    await saveRegistration(nextRegistration, false);
    await setCertificationType("self");
    setStage("doc_upload");
    setManualFlowStep(1);
    if (sessionId) {
      await fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, stage: "doc_upload" }),
      });
    }
    const msg = "Supplier registration confirmed. Please upload supporting documents to begin self verification.";
    setAssistant(msg);
    speakWithLanguage(msg);
  };

  const onVoice = async (text: string) => {
    if (stage === "voice_attestation") {
      await callAgent(text, "attestation");
      return;
    }
    await callAgent(text);
  };

  const onUpgrade = async () => {
    if (!digitalVerificationComplete) {
      const msg = "Please complete Digital Certification document upload and webcam ID verification before payment.";
      setAssistant(msg);
      speakWithLanguage(msg);
      return;
    }
    if (!registration.email || !registration.phone || !mockCardValid) {
      alert("Please fill all fields and enter valid card details.");
      return;
    }
    const nextRegistration = { ...registration, cert_type: "digital" };
    setRegistration(nextRegistration);
    setPaid(true);
    await saveRegistration(nextRegistration, true);
    await setCertificationType("digital");
    if (sessionId) {
      await fetch("/api/workflow/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "payment_transition", paymentState: "hold_placed" }),
      });
    }
    setStage("complete");
    setManualFlowStep(2);
    const msg = "Digital certification request submitted. We will verify your details and authenticity within 72 hours. If rejected, the payment hold will be refunded.";
    setAssistant(msg);
    speakWithLanguage(msg);
  };

  const startDigitalCertification = async () => {
    const nextRegistration = { ...registration, cert_type: "digital" };
    setRegistration(nextRegistration);
    setPaid(false);
    await saveRegistration(nextRegistration, false);
    await setCertificationType("digital");
    setVisionChecks((prev) => ({ ...prev, idPassed: false }));
    setStage("doc_upload");
    setManualFlowStep(2);
    if (sessionId) {
      await fetch("/api/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, stage: "doc_upload" }),
      });
    }
    const msg = "Digital Certification started. Please upload the region-specific required documents and any optional supporting documents.";
    setAssistant(msg);
    speakWithLanguage(msg);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6">
      <BlockAnchorAnimation active={anchoring} txHash={pendingTx} />

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-5">
        <Header 
          translations={translations} 
          audioEnabled={audioEnabled} 
          setAudioEnabled={setAudioEnabled} 
          embed={embed} 
        />

        <IntroSection 
          translations={translations}
          quotaFallbackNotice={quotaFallbackNotice}
          quotaFallbackReason={quotaFallbackReason}
          quotaFallbackSubtype={quotaFallbackSubtype}
        />

        <IntakeSection 
          show={currentFlowStep === 0 && !effectiveMatch}
          query={query}
          setQuery={setQuery}
          onDiscover={() => runDiscover()}
          sessionId={sessionId}
        />

        <StepperUI 
          flowSteps={flowSteps}
          currentFlowStep={currentFlowStep}
          match={effectiveMatch}
          activeCertType={activeCertType}
          registrationComplete={Boolean(effectiveMatch) && currentFlowStep > 0}
          selfVerificationComplete={Boolean(cert) || stage === "self_verified" || isDigitalPath}
          visionIdPassed={Boolean(visionChecks.idPassed)}
          setManualFlowStep={setManualFlowStep}
          onStartDigitalCertification={startDigitalCertification}
          resetRegistration={resetRegistration}
          confirmRegistration={confirmRegistration}
          stage={stage}
          cert={cert}
        />

        <RegistrationReview 
          show={currentFlowStep === 0}
          match={effectiveMatch}
          registration={registration}
          setRegistration={setRegistration}
          fieldConfidence={fieldConfidence}
          fieldEvidence={fieldEvidence}
          countryRequiresConfirmation={countryRequiresConfirmation}
          countryConfirmed={countryConfirmed}
          setCountryConfirmed={setCountryConfirmed}
          ownership={ownership}
          ownershipEvidenceConfidence={ownershipEvidenceConfidence}
          ownershipBreakdown={ownershipBreakdown}
          needsCandidateConfirmation={needsCandidateConfirmation}
          discoverCandidates={discoverCandidates}
          selectedCandidateIndex={selectedCandidateIndex}
          setSelectedCandidateIndex={setSelectedCandidateIndex}
          onRunDiscover={runDiscover}
          founderNames={founderNames}
          registrationCheck={registrationCheck}
          mergedBlockers={mergedBlockers}
          anchorFailureReason={anchorFailureReason}
          anchorOperatorHint={anchorOperatorHint}
          onConfirmRegistration={confirmRegistration}
        />

        <VerificationDisplay 
          show={currentFlowStep === 1 && !cert && stage !== "self_verified" && stage !== "anchoring"}
          stage={stage}
          stepNumber={2}
          certificationMode="self"
          assistant={assistant}
          badge={badge}
          visionNote={verification.visionNote}
          visionWarning={verification.visionWarning}
          visionBlockers={verification.visionBlockers}
          sessionId={sessionId}
          match={effectiveMatch}
          onVoice={onVoice}
          documentChecklist={documentChecklist}
          selectedDocuments={verification.selectedDocuments}
          setSelectedDocuments={verification.setSelectedDocuments}
          handleFileUpload={verification.handleFileUpload}
          isVerifyingDocs={verification.isVerifyingDocs}
          documentError={verification.documentError}
          documentProgress={verification.documentProgress}
          videoProgress={verification.videoProgress}
          scanning={verification.scanning}
          sendVision={verification.sendVision}
        />

        <CertificateDisplay 
          show={currentFlowStep === 1 && (Boolean(cert) || stage === "self_verified" || stage === "anchoring")}
          cert={cert}
          verifyUrl={typeof window !== "undefined" && cert ? `${window.location.origin}/verify/${cert.id}` : ""}
          downloadCertificatePdf={reports.downloadCertificatePdf}
          downloadingCertificate={reports.downloadingCertificate}
          onStartDigitalCertification={startDigitalCertification}
          readinessForIssue={readinessForIssue}
          mergedBlockers={mergedBlockers}
          anchoring={anchoring}
          anchorCert={anchorCert}
          setAssistant={setAssistant}
          speakWithLanguage={speakWithLanguage}
        />

        <VerificationDisplay 
          show={currentFlowStep === 2 && !paid && (stage === "doc_upload" || stage === "vision_id" || stage === "voice_attestation")}
          stage={stage}
          stepNumber={3}
          certificationMode="digital"
          assistant={assistant}
          badge={badge}
          visionNote={verification.visionNote}
          visionWarning={verification.visionWarning}
          visionBlockers={verification.visionBlockers}
          sessionId={sessionId}
          match={effectiveMatch}
          onVoice={onVoice}
          documentChecklist={documentChecklist}
          selectedDocuments={verification.selectedDocuments}
          setSelectedDocuments={verification.setSelectedDocuments}
          handleFileUpload={verification.handleFileUpload}
          isVerifyingDocs={verification.isVerifyingDocs}
          documentError={verification.documentError}
          documentProgress={verification.documentProgress}
          videoProgress={verification.videoProgress}
          scanning={verification.scanning}
          sendVision={verification.sendVision}
        />

        <UpgradePortal 
          show={currentFlowStep === 2}
          cert={cert}
          verifyUrl={typeof window !== "undefined" && cert ? `${window.location.origin}/verify/${cert.id}` : ""}
          registration={registration}
          setRegistration={setRegistration}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExpiry={cardExpiry}
          setCardExpiry={setCardExpiry}
          cardCvv={cardCvv}
          setCardCvv={setCardCvv}
          mockCardValid={mockCardValid}
          digitalVerificationComplete={digitalVerificationComplete}
          paid={paid}
          onUpgrade={onUpgrade}
        />
      </main>
    </div>
  );
}

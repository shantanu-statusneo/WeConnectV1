/**
 * English language strings for WEC-Guardian
 */

export const en = {
  // Header & Navigation
  header: {
    title: "WEC-Guardian · demonstration only",
    audioEnable: "Enable audio",
    audioDisable: "Disable audio",
    admin: "Admin",
    splitDemo: "Split demo",
  },

  // Main sections
  main: {
    certificateProcess: "60 second certificate process",
    certificateProcessDesc: "Build trust from self-declared profile to digitally certified supplier.",
    demoMode: "Demo mode: not legal identity verification",
    multiLanguageReady: "Multi-language ready: English, Hindi, French",
  },

  // Intake Section
  intake: {
    title: "Proactive intake",
    description: "Enter a business name or URL. Try Global Tech Solutions, Nile Logistics, or Red Sand Trading.",
    placeholder: "",
    discover: "Discover",
    instruction: "Enter business name or URL and click Discover.",
  },

  // Guided Flow
  flow: {
    title: "Guided Flow",
    registration: "Registration",
    registrationDesc: "Complete initial onboarding",
    selfVerification: "Self Verification",
    selfVerificationDesc: "Verify identity & details",
    getCertified: "Get Certified",
    getCertifiedDesc: "Final approval & certification",
    step1: "Discover",
    step2: "Profile",
    step3: "Voice",
    step4: "Documents",
    step5: "Identity",
    step6: "Payment",
    step7: "Anchor",
    continueButton: "Continue Self-Certification",
    startButton: "Start 60-second verification",
  },

  // Compliance & Trust
  compliance: {
    title: "Step 5: Compliance checks",
    complianceChecksTitle: "Compliance checks",
    trustReportTitle: "Step 6: Trust report",
    showControls: "SHOW CONTROLS",
    hideControls: "HIDE CONTROLS",
    upgradeOption: "Upgrade option",
    upgradeOptionDesc: "Upgrade to Digital Certification for higher visibility.",
    upgradeButton: "Upgrade to Digital Certification",
    advanced: "Advanced questionnaire, compliance checks, and trust report generation are available in this workspace.",
  },

  // Form Fields
  form: {
    ownershipControl: "Ownership control",
    ownershipControlPlaceholder: "Who controls ownership decisions?",
    operationalInvolvement: "Operational involvement",
    operationalInvolvementPlaceholder: "Describe day-to-day involvement",
    femaleOwnershipPct: "Female ownership %",
    currentDeliveryScale: "Current delivery scale/capacity",
    certType: "Certification type",
  },

  // Certification paths
  paths: {
    selfCertified: "Self-Certified",
    digitalCertification: "Digital Certification",
    notSelected: "Not selected",
    selfCertificationPath: "Self-certification path selected.",
    digitalCertificationPath: "Digital certification path selected.",
    pathLevel1: "PATH · Level 1 Self-Declared",
    pathLevel2: "PATH · Level 2 Self-Certified",
    pathLevel3: "PATH · Level 3 Digital",
  },

  // Status Messages
  status: {
    awaitingInput: "Awaiting input...",
    analyzingClip: "Analyzing your clip… please wait.",
    finalizingCertificate: "Finalizing certificate…",
    anchoringInProgress: "Anchoring is in progress.",
    sessionStillInitializing: "Session is still initializing. Please retry in a moment.",
    recoveredSession: "Recovered your session after a server reset. Continuing verification.",
    sessionExpired: "Session expired or reset. Please refresh to start a new verification session.",
  },

  // Errors
  errors: {
    discoveryFailed: "Discovery failed.",
    buyerSearchFailed: "Buyer search failed.",
    documentSubmissionError: "Document submission error:",
    failedDocumentVerification: "Failed to verify documents dynamically.",
    attestationFailed: "Attestation step failed.",
    anchoringFailed: "Anchoring failed.",
    couldNotUpdatePath: "Could not update certification path.",
    couldNotReachWorkflow: "Could not reach workflow service. Please retry.",
    couldNotIssueCertificate: "Could not issue certificate. Please retry.",
    couldNotDownloadCertificate: "Could not download certificate PDF. Please retry.",
    couldNotDownloadReport: "Could not download AI assessment report. Please retry.",
    certificateNotReady: "Certificate is not ready yet.",
    reportNotReady: "AI assessment report is not ready yet.",
  },

  // Document Verification
  documents: {
    uploadComplete: "Documents uploaded with minor issues. You can continue self-certification and review report flags.",
    verified: "Documents verified. Please proceed to ID video verification.",
    verificationFailed: "Document verification could not be completed. Please re-upload clearer documents.",
  },

  // ID Verification
  idVerification: {
    completeDesc: "ID verification complete. Please proceed to the payment gate to continue.",
    videoVerified: "ID video verified. Ownership remains prefill-derived and not vision-verified.",
    clickForVerification: "Click Start 60-second verification, then say yes.",
  },

  // Country Confirmation
  country: {
    confirmationRequired: "DISCOVERY REVIEW · candidate confirmation required",
    clickConfirm: "Click Confirm country to continue.",
    required: "Country is required before verification. Please enter and confirm the country.",
    confirm: "Confirm",
  },

  // Payment
  payment: {
    instructions: "Enter mock card details and mark payment as verified.",
    cardNumber: "Card number",
    cvv: "CVV",
  },

  // Certificate
  certificate: {
    issued: "CERTIFICATE ISSUED",
    chainMode: "CHAIN MODE · Base Sepolia confirmed",
    clickIssue: "Click Issue certificate to anchor and finish.",
    blocked: "Almost done: clear blockers before issuing certificate.",
    download: "DOWNLOAD OFFICIAL CERTIFICATE PDF",
  },

  // Reports
  reports: {
    downloadFull: "DOWNLOAD FULL REPORT",
    reportDownloaded: "AI assessment report downloaded.",
  },

  // Gemini/API Errors
  gemini: {
    capacityExhausted: "Gemini model capacity is temporarily exhausted.",
    quotaHit: "Gemini quota/rate limit was hit.",
    invalidApiKey: "Gemini API key is missing or invalid.",
    modelNotFound: "Configured Gemini model name is unavailable.",
    permissionDenied: "Gemini request was denied by permissions.",
    networkError: "Network/provider issue reaching Gemini.",
    unknownError: "Gemini live call failed.",
    capacityExhaustedGuidance: "Current model is at capacity. Retry shortly or configure model fallbacks with available capacity.",
    quotaGuidance: "Quota/rate limit reached. Retry later or switch to a model/tier with capacity.",
    invalidKeyGuidance: "Set a valid GEMINI_API_KEY in .env.local and restart the server.",
    modelNotFoundGuidance: "Update GEMINI_MODEL to an available model from Google AI Studio.",
    permissionGuidance: "Check API key permissions and project access for the selected Gemini model.",
    networkGuidance: "Provider/network issue. Verify internet/proxy/DNS, then retry.",
    defaultGuidance: "Review GEMINI_API_KEY and GEMINI_MODEL in .env.local.",
  },

  // UI Elements
  ui: {
    female: "Female",
    confirm: "Confirm",
    continuously: "Continuously monitored",
    authoritative: "Authoritative",
    txPending: "0x…pending",
    nse: "NSE",
    bse: "BSE",
    certificate: "Certificate",
    compliance: "Compliance",
  },

  // Messages
  messages: {
    questionnairesSaved: "Questionnaire saved.",
    complianceCompleted: "Compliance checks completed.",
  },

  // Language names
  languages: {
    english: "English",
    hindi: "हिन्दी",
    french: "Français",
  },
};

export type TranslationKeys = typeof en;

/**
 * French language strings for WEC-Guardian
 */

export const fr = {
  // Header & Navigation
  header: {
    title: "WEC-Guardian · démonstration uniquement",
    audioEnable: "Activer l'audio",
    audioDisable: "Désactiver l'audio",
    admin: "Admin",
    splitDemo: "Démo divisée",
  },

  // Main sections
  main: {
    certificateProcess: "Processus de certificat 60 secondes",
    certificateProcessDesc: "Construire la confiance du profil auto-déclaré au fournisseur certifié numériquement.",
    demoMode: "Mode démo : vérification d'identité légale non",
    multiLanguageReady: "Prêt multilingue : Anglais, Hindi, Français",
  },

  // Intake Section
  intake: {
    title: "Admission proactive",
    description: "Entrez un nom d'entreprise ou une URL. Essayez Global Tech Solutions, Nile Logistics ou Red Sand Trading.",
    placeholder: "Nom d'entreprise ou URL",
    discover: "Découvrir",
    instruction: "Entrez le nom de l'entreprise ou l'URL et cliquez sur Découvrir.",
  },

  // Guided Flow
  flow: {
    title: "Flux guidé",
    registration: "Enregistrement",
    registrationDesc: "Terminer l'intégration initiale",
    selfVerification: "Autovérification",
    selfVerificationDesc: "Vérifier l'identité et les détails",
    getCertified: "Obtenir une certification",
    getCertifiedDesc: "Approbation finale et certification",
    step1: "Découvrir",
    step2: "Profil",
    step3: "Voix",
    step4: "Documents",
    step5: "Identité",
    step6: "Paiement",
    step7: "Ancre",
    continueButton: "Continuer l'auto-certification",
    startButton: "Démarrer la vérification 60 secondes",
  },

  // Compliance & Trust
  compliance: {
    title: "Étape 5 : Vérifications de conformité",
    complianceChecksTitle: "Vérifications de conformité",
    trustReportTitle: "Étape 6 : Rapport de confiance",
    showControls: "AFFICHER LES COMMANDES",
    hideControls: "MASQUER LES COMMANDES",
    upgradeOption: "Option de mise à niveau",
    upgradeOptionDesc: "Mettez à niveau vers la certification numérique pour une meilleure visibilité.",
    upgradeButton: "Mettre à niveau vers la certification numérique",
    advanced: "Le questionnaire avancé, les vérifications de conformité et la génération de rapport de confiance sont disponibles dans cet espace de travail.",
  },

  // Form Fields
  form: {
    ownershipControl: "Contrôle de la propriété",
    ownershipControlPlaceholder: "Qui contrôle les décisions de propriété ?",
    operationalInvolvement: "Implication opérationnelle",
    operationalInvolvementPlaceholder: "Décrivez l'implication quotidienne",
    femaleOwnershipPct: "Pourcentage de propriété féminine",
    currentDeliveryScale: "Échelle/capacité de livraison actuelle",
    certType: "Type de certification",
  },

  // Certification paths
  paths: {
    selfCertified: "Auto-certifié",
    digitalCertification: "Certification numérique",
    notSelected: "Non sélectionné",
    selfCertificationPath: "Chemin d'auto-certification sélectionné.",
    digitalCertificationPath: "Chemin de certification numérique sélectionné.",
    pathLevel1: "CHEMIN · Niveau 1 Auto-déclaré",
    pathLevel2: "CHEMIN · Niveau 2 Auto-certifié",
    pathLevel3: "CHEMIN · Niveau 3 Numérique",
  },

  // Status Messages
  status: {
    awaitingInput: "En attente d'entrée...",
    analyzingClip: "Analyse de votre clip… veuillez attendre.",
    finalizingCertificate: "Finalisation du certificat…",
    anchoringInProgress: "L'ancrage est en cours.",
    sessionStillInitializing: "La session s'initialise toujours. Veuillez réessayer dans un instant.",
    recoveredSession: "Votre session a été récupérée après une réinitialisation du serveur. Vérification en cours.",
    sessionExpired: "La session a expiré ou a été réinitialisée. Veuillez rafraîchir pour démarrer une nouvelle session de vérification.",
  },

  // Errors
  errors: {
    discoveryFailed: "Découverte échouée.",
    buyerSearchFailed: "Recherche d'acheteur échouée.",
    documentSubmissionError: "Erreur de soumission de document :",
    failedDocumentVerification: "Vérification dynamique des documents échouée.",
    attestationFailed: "L'étape d'attestation a échoué.",
    anchoringFailed: "L'ancrage a échoué.",
    couldNotUpdatePath: "Impossible de mettre à jour le chemin de certification.",
    couldNotReachWorkflow: "Impossible d'atteindre le service de flux de travail. Veuillez réessayer.",
    couldNotIssueCertificate: "Impossible d'émettre le certificat. Veuillez réessayer.",
    couldNotDownloadCertificate: "Impossible de télécharger le PDF du certificat. Veuillez réessayer.",
    couldNotDownloadReport: "Impossible de télécharger le rapport d'évaluation IA. Veuillez réessayer.",
    certificateNotReady: "Le certificat n'est pas encore prêt.",
    reportNotReady: "Le rapport d'évaluation IA n'est pas encore prêt.",
  },

  // Document Verification
  documents: {
    uploadComplete: "Documents téléchargés avec des problèmes mineurs. Vous pouvez continuer l'auto-certification et examiner les drapeaux de rapport.",
    verified: "Documents vérifiés. Veuillez procéder à la vérification par vidéo d'identité.",
    verificationFailed: "La vérification des documents n'a pas pu être effectuée. Veuillez retélécharger des documents plus clairs.",
  },

  // ID Verification
  idVerification: {
    completeDesc: "Vérification d'identité complète. Veuillez procéder au portail de paiement pour continuer.",
    videoVerified: "Vidéo d'identité vérifiée. La propriété reste pré-remplie et n'est pas vérifiée par vision.",
    clickForVerification: "Cliquez sur Démarrer la vérification 60 secondes, puis dites oui.",
  },

  // Country Confirmation
  country: {
    confirmationRequired: "EXAMEN DE DÉCOUVERTE · confirmation de candidat requise",
    clickConfirm: "Cliquez sur Confirmer le pays pour continuer.",
    required: "Le pays est requis avant la vérification. Veuillez entrer et confirmer le pays.",
    confirm: "Confirmer",
  },

  // Payment
  payment: {
    instructions: "Entrez les détails de la carte fictive et marquez le paiement comme vérifié.",
    cardNumber: "Numéro de carte",
    cvv: "CVV",
  },

  // Certificate
  certificate: {
    issued: "CERTIFICAT ÉMIS",
    chainMode: "MODE CHAÎNE · Base Sepolia confirmée",
    clickIssue: "Cliquez sur Émettre le certificat pour ancrer et terminer.",
    blocked: "Presque terminé : effacez les bloqueurs avant d'émettre le certificat.",
    download: "TÉLÉCHARGER LE PDF DU CERTIFICAT OFFICIEL",
  },

  // Reports
  reports: {
    downloadFull: "TÉLÉCHARGER LE RAPPORT COMPLET",
    reportDownloaded: "Le rapport d'évaluation IA a été téléchargé.",
  },

  // Gemini/API Errors
  gemini: {
    capacityExhausted: "La capacité du modèle Gemini est temporairement épuisée.",
    quotaHit: "La limite de quota/taux Gemini a été atteinte.",
    invalidApiKey: "La clé API Gemini est manquante ou invalide.",
    modelNotFound: "Le modèle Gemini configuré est indisponible.",
    permissionDenied: "La demande Gemini a été refusée par les autorisations.",
    networkError: "Problème réseau/fournisseur lors de l'accès à Gemini.",
    unknownError: "L'appel en direct Gemini a échoué.",
    capacityExhaustedGuidance: "Le modèle actuel est à capacité. Réessayez bientôt ou configurez des secours de modèle avec une capacité disponible.",
    quotaGuidance: "Limite de quota/taux atteinte. Réessayez plus tard ou passez à un modèle/niveau avec capacité.",
    invalidKeyGuidance: "Définissez une clé GEMINI_API_KEY valide dans .env.local et redémarrez le serveur.",
    modelNotFoundGuidance: "Mettez à jour GEMINI_MODEL avec un modèle disponible de Google AI Studio.",
    permissionGuidance: "Vérifiez les autorisations des clés API et l'accès au projet pour le modèle Gemini sélectionné.",
    networkGuidance: "Problème de fournisseur/réseau. Vérifiez Internet/proxy/DNS, puis réessayez.",
    defaultGuidance: "Vérifiez GEMINI_API_KEY et GEMINI_MODEL dans .env.local.",
  },

  // UI Elements
  ui: {
    female: "Femme",
    confirm: "Confirmer",
    continuously: "Surveillé en continu",
    authoritative: "Faisant autorité",
    txPending: "0x…en attente",
    nse: "NSE",
    bse: "BSE",
    certificate: "Certificat",
    compliance: "Conformité",
  },

  // Messages
  messages: {
    questionnairesSaved: "Questionnaire enregistré.",
    complianceCompleted: "Vérifications de conformité complétées.",
  },

  // Language names
  languages: {
    english: "English",
    hindi: "हिन्दी",
    french: "Français",
  },
};

export type TranslationKeys = typeof fr;

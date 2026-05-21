export type VisionGateInput = {
  confidence: number;
  matchesPrimaryOwner: boolean;
  ownerKnownAndVerified: boolean;
};

export type VisionGateDecision = {
  pass: boolean;
  nameMatchBypassed: boolean;
  warningCode?: "owner_unverified_name_mismatch_bypassed" | "owner_name_mismatch_review";
};

export function decideVisionGate(input: VisionGateInput): VisionGateDecision {
  const confidencePass = Number(input.confidence) >= 35;
  const strictPass = confidencePass && input.matchesPrimaryOwner;
  if (strictPass) {
    return { pass: true, nameMatchBypassed: false };
  }

  if (confidencePass && !input.matchesPrimaryOwner) {
    return {
      pass: true,
      nameMatchBypassed: true,
      warningCode: input.ownerKnownAndVerified
        ? "owner_name_mismatch_review"
        : "owner_unverified_name_mismatch_bypassed",
    };
  }

  return { pass: false, nameMatchBypassed: false };
}

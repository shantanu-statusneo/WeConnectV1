import { describe, expect, it } from "vitest";
import { decideVisionGate } from "./vision-gate";

describe("decideVisionGate", () => {
  it("allows unknown-owner mismatch when confidence is high", () => {
    const out = decideVisionGate({
      confidence: 70,
      matchesPrimaryOwner: false,
      ownerKnownAndVerified: false,
    });
    expect(out.pass).toBe(true);
    expect(out.nameMatchBypassed).toBe(true);
    expect(out.warningCode).toBe("owner_unverified_name_mismatch_bypassed");
  });

  it("allows known-owner mismatch with review warning when confidence is usable", () => {
    const out = decideVisionGate({
      confidence: 70,
      matchesPrimaryOwner: false,
      ownerKnownAndVerified: true,
    });
    expect(out.pass).toBe(true);
    expect(out.nameMatchBypassed).toBe(true);
    expect(out.warningCode).toBe("owner_name_mismatch_review");
  });

  it("blocks low-confidence clips regardless of owner status", () => {
    const outUnknown = decideVisionGate({
      confidence: 25,
      matchesPrimaryOwner: false,
      ownerKnownAndVerified: false,
    });
    const outKnown = decideVisionGate({
      confidence: 25,
      matchesPrimaryOwner: true,
      ownerKnownAndVerified: true,
    });
    expect(outUnknown.pass).toBe(false);
    expect(outKnown.pass).toBe(false);
  });
});

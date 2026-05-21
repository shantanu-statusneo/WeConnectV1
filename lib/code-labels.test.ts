import { describe, expect, it } from "vitest";
import { formatCodeList, formatNaicsCode, formatUnspscCode } from "./code-labels";

describe("classification code labels", () => {
  it("shows the NAICS meaning for fetched six-digit codes", () => {
    expect(formatNaicsCode("541511")).toBe("541511 - Custom Computer Programming Services");
  });

  it("falls back to the NAICS sector meaning for broad codes", () => {
    expect(formatNaicsCode("54")).toBe("54 - Professional, Scientific, and Technical Services");
  });

  it("shows UNSPSC meanings for exact and class-level codes", () => {
    expect(formatUnspscCode("81112200")).toBe("81112200 - Software maintenance and support");
    expect(formatUnspscCode("80000000")).toBe("80000000 - Management and Business Professionals Services");
  });

  it("formats lists with a provided empty label", () => {
    expect(formatCodeList([], "naics", "No codes")).toBe("No codes");
  });
});

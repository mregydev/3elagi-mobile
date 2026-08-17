import { describe, expect, it } from "vitest";
import { formatUsd, pointsToUsd, usdPerPoint } from "./usd";

describe("consultation value in USD", () => {
  it("prices by the patient's market", () => {
    expect(usdPerPoint("EG")).toBe(2);
    expect(usdPerPoint("JO")).toBe(15);
    expect(usdPerPoint("SA")).toBe(50);
  });

  it("treats unknown or missing countries as international", () => {
    // A missing country must never silently price at the cheapest rate.
    expect(usdPerPoint(null)).toBe(50);
    expect(usdPerPoint("")).toBe(50);
    expect(usdPerPoint(" eg ")).toBe(2);
  });

  it("multiplies credits by the rate", () => {
    expect(pointsToUsd(2, "EG")).toBe(4);
    expect(pointsToUsd(2, "US")).toBe(100);
    expect(pointsToUsd(Number.NaN, "EG")).toBe(0);
  });

  it("formats without trailing zeros on whole amounts", () => {
    expect(formatUsd(104)).toBe("104 USD");
    expect(formatUsd(1.5)).toBe("1.50 USD");
  });
});

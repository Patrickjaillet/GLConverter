import { describe, it, expect } from "vitest";
import { checkEquivalence, EquivalenceStatus } from "./EquivalenceValidator";

describe("checkEquivalence", () => {
  it("reports Verified when the reconstructed code is behaviorally equivalent to the golfed input", () => {
    const golfedSource = "function f(x){return x?1:2;}";
    const reconstructed = "function f(x) {\n  if (x) {\n    return 1;\n  } else {\n    return 2;\n  }\n}";

    expect(checkEquivalence(golfedSource, reconstructed)).toBe(EquivalenceStatus.Verified);
  });

  it("reports Uncertain when the reconstructed code changes behavior", () => {
    const golfedSource = "function f(x){return x?1:2;}";
    const reconstructed = "function f(x) {\n  if (x) {\n    return 2;\n  } else {\n    return 1;\n  }\n}";

    expect(checkEquivalence(golfedSource, reconstructed)).toBe(EquivalenceStatus.Uncertain);
  });

  it("reports Uncertain when the golfed source fails to parse", () => {
    expect(checkEquivalence("function f(x) {", "function f(x) {}")).toBe(EquivalenceStatus.Uncertain);
  });

  it("reports Uncertain when the reconstructed output fails to parse", () => {
    expect(checkEquivalence("function f(x){return x;}", "function f(x) {")).toBe(EquivalenceStatus.Uncertain);
  });

  it("is insensitive to identifier naming differences between the two inputs", () => {
    const golfedSource = "function greet(name){return name;}";
    const reconstructed = "function func1(param1) {\n  return param1;\n}";

    expect(checkEquivalence(golfedSource, reconstructed)).toBe(EquivalenceStatus.Verified);
  });
});

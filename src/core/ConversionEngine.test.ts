import { describe, it, expect } from "vitest";
import {
  ConversionEngine,
  ConversionMode,
  ConversionDirection,
  EquivalenceStatus
} from "./ConversionEngine";
import { defaultGolfRules } from "./transform/GolfRules";

describe("ConversionEngine", () => {
  const engine = new ConversionEngine();

  it("returns an empty, not-checked result for blank input", () => {
    const result = engine.convert("   ", ConversionMode.Minified);

    expect(result.code).toBe("");
    expect(result.convertedLength).toBe(0);
    expect(result.compressionRatio).toBe(0);
    expect(result.equivalence).toBe(EquivalenceStatus.NotChecked);
    expect(result.errorMessage).toBeNull();
  });

  it("golfs and minifies source code by default", () => {
    const result = engine.convert("function greet(name) {\n  return name;\n}", ConversionMode.Minified);

    expect(result.direction).toBe(ConversionDirection.Golf);
    expect(result.mode).toBe(ConversionMode.Minified);
    expect(result.errorMessage).toBeNull();
    expect(result.code.length).toBeLessThan(result.originalLength);
    expect(result.compressionRatio).toBeGreaterThan(0);
  });

  it("produces readable, indented output in Justified mode", () => {
    const result = engine.convert("function greet(name){return name;}", ConversionMode.Justified);

    expect(result.code).toContain("\n");
    expect(result.mode).toBe(ConversionMode.Justified);
  });

  it("skips golfing transforms entirely in the Degolf direction and forces Justified mode", () => {
    const result = engine.convert("function f(x){return x?1:2;}", ConversionMode.Minified, defaultGolfRules, ConversionDirection.Degolf);

    expect(result.direction).toBe(ConversionDirection.Degolf);
    expect(result.mode).toBe(ConversionMode.Justified);
    expect(result.code).toContain("if (");
  });

  it("reports an equivalence status only for the Degolf direction", () => {
    const golfResult = engine.convert("const a = 1;", ConversionMode.Minified);
    const degolfResult = engine.convert("const a=1;", ConversionMode.Minified, defaultGolfRules, ConversionDirection.Degolf);

    expect(golfResult.equivalence).toBe(EquivalenceStatus.NotChecked);
    expect(degolfResult.equivalence).not.toBe(EquivalenceStatus.NotChecked);
  });

  it("respects disabled golfing rules when producing golfed output", () => {
    const withRenaming = engine.convert("function greet(name){return name;}", ConversionMode.Minified);
    const withoutRenaming = engine.convert(
      "function greet(name){return name;}",
      ConversionMode.Minified,
      { ...defaultGolfRules, variableRenaming: false }
    );

    expect(withRenaming.code).not.toContain("greet");
    expect(withoutRenaming.code).toContain("greet");
  });

  it("returns the original source and a parse error message for invalid syntax", () => {
    const result = engine.convert("function ( { ;;;", ConversionMode.Minified);

    expect(result.errorMessage).not.toBeNull();
    expect(result.code).toBe("function ( { ;;;");
    expect(result.compressionRatio).toBe(0);
  });

  it("computes character counts consistently for a successful conversion", () => {
    const source = "const value = 1 + 1;";
    const result = engine.convert(source, ConversionMode.Minified);

    expect(result.originalLength).toBe(source.length);
    expect(result.convertedLength).toBe(result.code.length);
  });
});

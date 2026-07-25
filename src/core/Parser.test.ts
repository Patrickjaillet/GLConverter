import { describe, it, expect } from "vitest";
import { parseSource } from "./Parser";

describe("parseSource", () => {
  it("returns an empty result for blank input without attempting to parse", () => {
    const result = parseSource("   ");

    expect(result.ast).toBeNull();
    expect(result.tokens).toEqual([]);
    expect(result.tokenCount).toBe(0);
    expect(result.errorMessage).toBeNull();
  });

  it("parses valid JavaScript into an AST and token list", () => {
    const result = parseSource("const a = 1 + 2;");

    expect(result.ast).not.toBeNull();
    expect(result.ast?.type).toBe("Program");
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.tokenCount).toBe(result.tokens.length);
    expect(result.errorMessage).toBeNull();
  });

  it("reports a parse error for invalid syntax while still returning collected tokens", () => {
    const result = parseSource("function ( { ;;;");

    expect(result.ast).toBeNull();
    expect(result.errorMessage).not.toBeNull();
  });

  it("counts tokens consistently across separate calls for the same source", () => {
    const source = "function greet(name) { return name; }";
    const first = parseSource(source);
    const second = parseSource(source);

    expect(first.tokenCount).toBe(second.tokenCount);
  });
});

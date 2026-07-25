import { describe, it, expect } from "vitest";
import { detectLanguage, SourceLanguage } from "./LanguageDetector";

describe("detectLanguage", () => {
  it("returns Unknown for empty or whitespace-only input", () => {
    expect(detectLanguage("")).toBe(SourceLanguage.Unknown);
    expect(detectLanguage("   \n  ")).toBe(SourceLanguage.Unknown);
  });

  it("detects JavaScript from a function declaration", () => {
    expect(detectLanguage("function greet(name) { return name; }")).toBe(SourceLanguage.JavaScript);
  });

  it("detects JavaScript from variable declaration keywords", () => {
    expect(detectLanguage("const x = 1;")).toBe(SourceLanguage.JavaScript);
    expect(detectLanguage("let y = 2;")).toBe(SourceLanguage.JavaScript);
    expect(detectLanguage("var z = 3;")).toBe(SourceLanguage.JavaScript);
  });

  it("detects JavaScript from arrow function syntax", () => {
    expect(detectLanguage("const add = (a, b) => a + b;")).toBe(SourceLanguage.JavaScript);
  });

  it("detects JavaScript from a console.log call", () => {
    expect(detectLanguage("console.log('hi')")).toBe(SourceLanguage.JavaScript);
  });

  it("returns Unknown for input with no recognizable JavaScript signature", () => {
    expect(detectLanguage("Bonjour tout le monde")).toBe(SourceLanguage.Unknown);
  });
});

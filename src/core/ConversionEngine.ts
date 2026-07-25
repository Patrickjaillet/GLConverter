import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "./Parser";
import { applyGolfTransforms } from "./transform/GolfPipeline";
import { generateMinified, generateJustified } from "./CodeGenerator";
import { defaultGolfRules, type GolfRules } from "./transform/GolfRules";

export enum ConversionMode {
  Minified = "minified",
  Justified = "justified"
}

export interface ConversionResult {
  code: string;
  mode: ConversionMode;
  originalLength: number;
  convertedLength: number;
  compressionRatio: number;
  errorMessage: string | null;
}

export class ConversionEngine {
  public convert(source: string, mode: ConversionMode, rules: GolfRules = defaultGolfRules): ConversionResult {
    const trimmed = source.trim();

    if (trimmed.length === 0) {
      return {
        code: "",
        mode,
        originalLength: source.length,
        convertedLength: 0,
        compressionRatio: 0,
        errorMessage: null
      };
    }

    try {
      const ast = parse(trimmed, acornOptions) as Program;
      applyGolfTransforms(ast, rules);

      const code = mode === ConversionMode.Minified ? generateMinified(ast) : generateJustified(ast);
      const compressionRatio = source.length === 0 ? 0 : (1 - code.length / source.length) * 100;

      return {
        code,
        mode,
        originalLength: source.length,
        convertedLength: code.length,
        compressionRatio,
        errorMessage: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown conversion error";
      return {
        code: source,
        mode,
        originalLength: source.length,
        convertedLength: source.length,
        compressionRatio: 0,
        errorMessage: message
      };
    }
  }
}

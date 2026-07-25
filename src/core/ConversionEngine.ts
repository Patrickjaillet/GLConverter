import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "./Parser";
import { applyGolfTransforms } from "./transform/GolfPipeline";
import { generateMinified, generateJustified } from "./CodeGenerator";

export enum ConversionMode {
  Minified = "minified",
  Justified = "justified"
}

export interface ConversionResult {
  code: string;
  mode: ConversionMode;
  originalLength: number;
  convertedLength: number;
  errorMessage: string | null;
}

export class ConversionEngine {
  public convert(source: string, mode: ConversionMode): ConversionResult {
    const trimmed = source.trim();

    if (trimmed.length === 0) {
      return { code: "", mode, originalLength: source.length, convertedLength: 0, errorMessage: null };
    }

    try {
      const ast = parse(trimmed, acornOptions) as Program;
      applyGolfTransforms(ast);

      const code = mode === ConversionMode.Minified ? generateMinified(ast) : generateJustified(ast);

      return { code, mode, originalLength: source.length, convertedLength: code.length, errorMessage: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown conversion error";
      return {
        code: source,
        mode,
        originalLength: source.length,
        convertedLength: source.length,
        errorMessage: message
      };
    }
  }
}

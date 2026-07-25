import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "./Parser";
import { applyGolfTransforms } from "./transform/GolfPipeline";
import { applyDegolfTransforms } from "./transform/DegolfPipeline";
import { generateMinified, generateJustified } from "./CodeGenerator";
import { defaultGolfRules, type GolfRules } from "./transform/GolfRules";
import { checkEquivalence, EquivalenceStatus } from "./EquivalenceValidator";
import { engineManager } from "./EngineManager";

export enum ConversionMode {
  Minified = "minified",
  Justified = "justified"
}

export enum ConversionDirection {
  Golf = "golf",
  Degolf = "degolf"
}

export { EquivalenceStatus };

export interface ConversionResult {
  code: string;
  mode: ConversionMode;
  direction: ConversionDirection;
  originalLength: number;
  convertedLength: number;
  compressionRatio: number;
  equivalence: EquivalenceStatus;
  errorMessage: string | null;
}

export class ConversionEngine {
  public convert(
    source: string,
    mode: ConversionMode,
    rules: GolfRules = defaultGolfRules,
    direction: ConversionDirection = ConversionDirection.Golf
  ): ConversionResult {
    const trimmed = source.trim();

    if (trimmed.length === 0) {
      return {
        code: "",
        mode,
        direction,
        originalLength: source.length,
        convertedLength: 0,
        compressionRatio: 0,
        equivalence: EquivalenceStatus.NotChecked,
        errorMessage: null
      };
    }

    try {
      const ast = parse(trimmed, acornOptions) as Program;

      if (direction === ConversionDirection.Degolf) {
        applyDegolfTransforms(ast);
        const code = generateJustified(ast);
        const compressionRatio = source.length === 0 ? 0 : (1 - code.length / source.length) * 100;
        const equivalence = checkEquivalence(trimmed, code);

        return {
          code,
          mode: ConversionMode.Justified,
          direction,
          originalLength: source.length,
          convertedLength: code.length,
          compressionRatio,
          equivalence,
          errorMessage: null
        };
      }

      applyGolfTransforms(ast, rules);

      const code =
        mode === ConversionMode.Minified
          ? generateMinified(ast, (raw) => engineManager.compactWhitespace(raw))
          : generateJustified(ast);
      const compressionRatio = source.length === 0 ? 0 : (1 - code.length / source.length) * 100;

      return {
        code,
        mode,
        direction,
        originalLength: source.length,
        convertedLength: code.length,
        compressionRatio,
        equivalence: EquivalenceStatus.NotChecked,
        errorMessage: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown conversion error";

      return {
        code: source,
        mode,
        direction,
        originalLength: source.length,
        convertedLength: source.length,
        compressionRatio: 0,
        equivalence: EquivalenceStatus.NotChecked,
        errorMessage: message
      };
    }
  }
}

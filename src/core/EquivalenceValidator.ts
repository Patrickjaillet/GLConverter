import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "./Parser";
import { applyGolfTransforms } from "./transform/GolfPipeline";
import { applyCanonicalRenaming } from "./transform/CanonicalRenamer";
import { generateMinified } from "./CodeGenerator";
import { defaultGolfRules } from "./transform/GolfRules";

export enum EquivalenceStatus {
  Verified = "verified",
  Uncertain = "uncertain",
  NotChecked = "not-checked"
}

function golfSignature(code: string): string | null {
  try {
    const ast = parse(code, acornOptions) as Program;
    applyGolfTransforms(ast, { ...defaultGolfRules, variableRenaming: false });
    applyCanonicalRenaming(ast);
    return generateMinified(ast);
  } catch {
    return null;
  }
}

export function checkEquivalence(golfedSource: string, structuredOutput: string): EquivalenceStatus {
  const originalSignature = golfSignature(golfedSource);
  const reconstructedSignature = golfSignature(structuredOutput);

  if (originalSignature === null || reconstructedSignature === null) {
    return EquivalenceStatus.Uncertain;
  }

  return originalSignature === reconstructedSignature ? EquivalenceStatus.Verified : EquivalenceStatus.Uncertain;
}

import type { Program } from "acorn";
import { optimizeBodies } from "./BodyOptimizer";
import { renameVariables } from "./VariableRenamer";
import { simplifyOperators } from "./OperatorSimplifier";
import { golfLoops } from "./LoopGolfer";
import { golfConditionals } from "./TernaryOptimizer";
import { golfNativeCalls } from "./NativeCallOptimizer";
import type { AstNode } from "./AstTraversal";
import { defaultGolfRules, type GolfRules } from "./GolfRules";

export function applyGolfTransforms(ast: Program, rules: GolfRules = defaultGolfRules): void {
  optimizeBodies(ast as unknown as AstNode, rules);

  if (rules.loopGolfing) {
    golfLoops(ast as unknown as AstNode);
  }

  if (rules.ternaryGolfing) {
    golfConditionals(ast as unknown as AstNode);
  }

  if (rules.nativeCallGolfing) {
    golfNativeCalls(ast as unknown as AstNode);
  }

  if (rules.variableRenaming) {
    renameVariables(ast);
  }

  if (rules.operatorSimplification) {
    simplifyOperators(ast as unknown as AstNode);
  }
}

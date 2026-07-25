import type { Program } from "acorn";
import { optimizeBodies } from "./BodyOptimizer";
import { renameVariables } from "./VariableRenamer";
import { simplifyOperators } from "./OperatorSimplifier";
import type { AstNode } from "./AstTraversal";

export function applyGolfTransforms(ast: Program): void {
  optimizeBodies(ast as unknown as AstNode);
  renameVariables(ast);
  simplifyOperators(ast as unknown as AstNode);
}

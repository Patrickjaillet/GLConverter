import { forEachNode, type AstNode } from "./AstTraversal";
import { eliminateDeadCode } from "./DeadCodeEliminator";
import { mergeDeclarations } from "./DeclarationMerger";

export interface BodyOptimizerRules {
  deadCodeElimination: boolean;
  declarationMerging: boolean;
}

export function optimizeBodies(ast: AstNode, rules: BodyOptimizerRules): void {
  forEachNode(ast, (node) => {
    if (Array.isArray(node.body)) {
      const body = node.body as AstNode[];

      if (rules.deadCodeElimination) {
        eliminateDeadCode(body);
      }

      if (rules.declarationMerging) {
        mergeDeclarations(body);
      }
    } else if (node.type === "SwitchCase" && Array.isArray(node.consequent)) {
      if (rules.deadCodeElimination) {
        eliminateDeadCode(node.consequent as AstNode[]);
      }
    }
  });
}

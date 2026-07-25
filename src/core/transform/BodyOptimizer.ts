import { forEachNode, type AstNode } from "./AstTraversal";
import { eliminateDeadCode } from "./DeadCodeEliminator";
import { mergeDeclarations } from "./DeclarationMerger";

export function optimizeBodies(ast: AstNode): void {
  forEachNode(ast, (node) => {
    if (Array.isArray(node.body)) {
      const body = node.body as AstNode[];
      eliminateDeadCode(body);
      mergeDeclarations(body);
    } else if (node.type === "SwitchCase" && Array.isArray(node.consequent)) {
      eliminateDeadCode(node.consequent as AstNode[]);
    }
  });
}

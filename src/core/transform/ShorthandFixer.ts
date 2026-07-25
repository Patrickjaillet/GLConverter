import { forEachNode, type AstNode } from "./AstTraversal";

export function fixShorthandProperties(ast: AstNode): void {
  forEachNode(ast, (node) => {
    if (node.type !== "Property" || node.shorthand !== true) {
      return;
    }

    const key = node.key as AstNode;
    const value = node.value as AstNode;

    if (key.type === "Identifier" && value.type === "Identifier" && key.name !== value.name) {
      node.shorthand = false;
    }
  });
}

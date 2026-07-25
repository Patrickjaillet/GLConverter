import { forEachNode, type AstNode } from "./AstTraversal";

const statementBodyKeys: Record<string, string[]> = {
  IfStatement: ["consequent", "alternate"],
  ForStatement: ["body"],
  ForInStatement: ["body"],
  ForOfStatement: ["body"],
  WhileStatement: ["body"],
  DoWhileStatement: ["body"]
};

function wrapIfNeeded(node: AstNode, key: string): void {
  const value = node[key] as AstNode | null | undefined;

  if (value === null || value === undefined || value.type === "BlockStatement") {
    return;
  }

  if (key === "alternate" && value.type === "IfStatement") {
    return;
  }

  node[key] = { type: "BlockStatement", body: [value] };
}

export function normalizeBlocks(ast: AstNode): void {
  forEachNode(ast, (node) => {
    const keys = statementBodyKeys[node.type];

    if (keys === undefined) {
      return;
    }

    for (const key of keys) {
      wrapIfNeeded(node, key);
    }
  });
}

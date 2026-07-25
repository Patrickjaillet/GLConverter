export interface AstNode {
  type: string;
  [key: string]: unknown;
}

export function isAstNode(value: unknown): value is AstNode {
  return value !== null && typeof value === "object" && typeof (value as AstNode).type === "string";
}

export function forEachNode(node: unknown, visit: (node: AstNode) => void): void {
  if (node === null || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      forEachNode(item, visit);
    }
    return;
  }

  if (isAstNode(node)) {
    visit(node);
  }

  for (const key of Object.keys(node)) {
    if (key === "type") {
      continue;
    }

    const value = (node as Record<string, unknown>)[key];

    if (value !== null && typeof value === "object") {
      forEachNode(value, visit);
    }
  }
}

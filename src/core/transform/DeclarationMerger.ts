import type { AstNode } from "./AstTraversal";

export function mergeDeclarations(body: AstNode[]): void {
  for (let index = body.length - 2; index >= 0; index--) {
    const current = body[index];
    const next = body[index + 1];

    if (current === undefined || next === undefined) {
      continue;
    }

    if (current.type !== "VariableDeclaration" || next.type !== "VariableDeclaration") {
      continue;
    }

    if (current.kind !== next.kind) {
      continue;
    }

    const currentDeclarations = current.declarations as AstNode[];
    const nextDeclarations = next.declarations as AstNode[];

    currentDeclarations.push(...nextDeclarations);
    body.splice(index + 1, 1);
  }
}

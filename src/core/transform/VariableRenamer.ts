import * as eslintScope from "eslint-scope";
import type { Program } from "acorn";
import { forEachNode, type AstNode } from "./AstTraversal";

const reservedWords = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
  "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import",
  "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw", "true",
  "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "enum", "await",
  "implements", "package", "protected", "interface", "private", "public", "arguments", "eval",
  "undefined", "of", "async", "get", "set"
]);

const alphabet = "abcdefghijklmnopqrstuvwxyz";

function nextShortName(startIndex: number, takenNames: Set<string>): { name: string; nextIndex: number } {
  let index = startIndex;

  while (true) {
    let name = "";
    let remainder = index;

    do {
      name = alphabet[remainder % 26] + name;
      remainder = Math.floor(remainder / 26) - 1;
    } while (remainder >= 0);

    index++;

    if (!reservedWords.has(name) && !takenNames.has(name)) {
      return { name, nextIndex: index };
    }
  }
}

function collectExistingNames(ast: AstNode): Set<string> {
  const names = new Set<string>();

  forEachNode(ast, (node) => {
    if (node.type === "Identifier" && typeof node.name === "string") {
      names.add(node.name as string);
    }
  });

  return names;
}

function fixShorthandProperties(ast: AstNode): void {
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

export function renameVariables(ast: Program): void {
  const manager = eslintScope.analyze(ast as unknown as Parameters<typeof eslintScope.analyze>[0], {
    ecmaVersion: 2022,
    sourceType: ast.sourceType === "module" ? "module" : "script",
    optimistic: false,
    ignoreEval: true
  });

  if (manager.globalScope === null) {
    return;
  }

  const takenNames = collectExistingNames(ast as unknown as AstNode);
  let nameIndex = 0;

  const visitScope = (scope: eslintScope.Scope): void => {
    for (const variable of scope.variables) {
      if (variable.name === "arguments" || variable.defs.length === 0) {
        continue;
      }

      const firstDef = variable.defs[0];

      if (firstDef === undefined || firstDef.type === "CatchClause") {
        continue;
      }

      const generated = nextShortName(nameIndex, takenNames);
      nameIndex = generated.nextIndex;
      takenNames.add(generated.name);

      for (const identifier of variable.identifiers) {
        (identifier as unknown as AstNode).name = generated.name;
      }

      for (const reference of variable.references) {
        (reference.identifier as unknown as AstNode).name = generated.name;
      }
    }

    for (const childScope of scope.childScopes) {
      visitScope(childScope);
    }
  };

  visitScope(manager.globalScope);
  fixShorthandProperties(ast as unknown as AstNode);
}

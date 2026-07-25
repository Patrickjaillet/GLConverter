import * as eslintScope from "eslint-scope";
import type { Program } from "acorn";
import type { AstNode } from "./AstTraversal";
import { reservedWords } from "./ReservedWords";
import { fixShorthandProperties } from "./ShorthandFixer";

const alphabet = "abcdefghijklmnopqrstuvwxyz";

function nextShortName(startIndex: number, blocked: Set<string>): { name: string; nextIndex: number } {
  let index = startIndex;

  while (true) {
    let name = "";
    let remainder = index;

    do {
      name = alphabet[remainder % 26] + name;
      remainder = Math.floor(remainder / 26) - 1;
    } while (remainder >= 0);

    index++;

    if (!reservedWords.has(name) && !blocked.has(name)) {
      return { name, nextIndex: index };
    }
  }
}

function collectFreeNames(scope: eslintScope.Scope): Set<string> {
  const names = new Set<string>();

  for (const reference of scope.through) {
    names.add(reference.identifier.name);
  }

  return names;
}

export function applyCanonicalRenaming(ast: Program): void {
  const manager = eslintScope.analyze(ast as unknown as Parameters<typeof eslintScope.analyze>[0], {
    ecmaVersion: 2022,
    sourceType: ast.sourceType === "module" ? "module" : "script",
    optimistic: false,
    ignoreEval: true
  });

  if (manager.globalScope === null) {
    return;
  }

  const blocked = collectFreeNames(manager.globalScope);
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

      const generated = nextShortName(nameIndex, blocked);
      nameIndex = generated.nextIndex;

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

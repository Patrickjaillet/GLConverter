import * as eslintScope from "eslint-scope";
import type { Program } from "acorn";
import { forEachNode, type AstNode } from "./AstTraversal";
import { reservedWords } from "./ReservedWords";
import { fixShorthandProperties } from "./ShorthandFixer";

function collectExistingNames(ast: AstNode): Set<string> {
  const names = new Set<string>();

  forEachNode(ast, (node) => {
    if (node.type === "Identifier" && typeof node.name === "string") {
      names.add(node.name as string);
    }
  });

  return names;
}

function collectLoopCounterNames(ast: AstNode): Set<string> {
  const names = new Set<string>();

  forEachNode(ast, (node) => {
    if (node.type !== "ForStatement") {
      return;
    }

    const init = node.init as AstNode | null | undefined;

    if (init === null || init === undefined || init.type !== "VariableDeclaration") {
      return;
    }

    for (const declarator of init.declarations as AstNode[]) {
      const id = declarator.id as AstNode;

      if (id.type === "Identifier") {
        names.add(id.name as string);
      }
    }
  });

  return names;
}

function uniqueName(base: string, counters: Map<string, number>, taken: Set<string>): string {
  let index = (counters.get(base) ?? 0) + 1;
  let candidate = `${base}${index}`;

  while (taken.has(candidate) || reservedWords.has(candidate)) {
    index++;
    candidate = `${base}${index}`;
  }

  counters.set(base, index);
  taken.add(candidate);
  return candidate;
}

function categoryFor(variable: eslintScope.Variable, loopCounterNames: Set<string>): string {
  const firstDef = variable.defs[0];

  if (firstDef === undefined) {
    return "value";
  }

  if (firstDef.type === "Parameter") {
    return "param";
  }

  if (firstDef.type === "FunctionName") {
    return "func";
  }

  if (firstDef.type === "ClassName") {
    return "className";
  }

  if (loopCounterNames.has(variable.name)) {
    return "index";
  }

  return "value";
}

export function applyDescriptiveRenaming(ast: Program): void {
  const manager = eslintScope.analyze(ast as unknown as Parameters<typeof eslintScope.analyze>[0], {
    ecmaVersion: 2022,
    sourceType: ast.sourceType === "module" ? "module" : "script",
    optimistic: false,
    ignoreEval: true
  });

  if (manager.globalScope === null) {
    return;
  }

  const loopCounterNames = collectLoopCounterNames(ast as unknown as AstNode);
  const takenNames = collectExistingNames(ast as unknown as AstNode);
  const counters = new Map<string, number>();

  const visitScope = (scope: eslintScope.Scope): void => {
    for (const variable of scope.variables) {
      if (variable.name === "arguments" || variable.defs.length === 0) {
        continue;
      }

      const firstDef = variable.defs[0];

      if (firstDef === undefined || firstDef.type === "CatchClause") {
        continue;
      }

      const category = categoryFor(variable, loopCounterNames);
      const generated = uniqueName(category, counters, takenNames);

      for (const identifier of variable.identifiers) {
        (identifier as unknown as AstNode).name = generated;
      }

      for (const reference of variable.references) {
        (reference.identifier as unknown as AstNode).name = generated;
      }
    }

    for (const childScope of scope.childScopes) {
      visitScope(childScope);
    }
  };

  visitScope(manager.globalScope);
  fixShorthandProperties(ast as unknown as AstNode);
}

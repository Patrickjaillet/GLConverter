import type { AstNode } from "./AstTraversal";

const terminatorTypes = new Set(["ReturnStatement", "ThrowStatement", "BreakStatement", "ContinueStatement"]);

function isPureExpression(expression: AstNode): boolean {
  return expression.type === "Literal" || expression.type === "Identifier";
}

function collapseLiteralConditionals(body: AstNode[]): boolean {
  for (let index = 0; index < body.length; index++) {
    const statement = body[index];

    if (statement === undefined || statement.type !== "IfStatement") {
      continue;
    }

    const test = statement.test as AstNode;

    if (test.type !== "Literal") {
      continue;
    }

    const isTruthy = Boolean(test.value);
    const branch = (isTruthy ? statement.consequent : statement.alternate) as AstNode | null | undefined;

    let replacement: AstNode[];

    if (branch === null || branch === undefined) {
      replacement = [];
    } else if (branch.type === "BlockStatement") {
      replacement = branch.body as AstNode[];
    } else {
      replacement = [branch];
    }

    body.splice(index, 1, ...replacement);
    return true;
  }

  return false;
}

function trimUnreachableStatements(body: AstNode[]): boolean {
  for (let index = 0; index < body.length; index++) {
    const statement = body[index];

    if (statement !== undefined && terminatorTypes.has(statement.type) && index < body.length - 1) {
      body.length = index + 1;
      return true;
    }
  }

  return false;
}

function removeRedundantExpressions(body: AstNode[]): boolean {
  for (let index = 0; index < body.length; index++) {
    const statement = body[index];

    if (statement === undefined) {
      continue;
    }

    if (statement.type === "EmptyStatement") {
      body.splice(index, 1);
      return true;
    }

    if (statement.type === "ExpressionStatement" && isPureExpression(statement.expression as AstNode)) {
      body.splice(index, 1);
      return true;
    }
  }

  return false;
}

export function eliminateDeadCode(body: AstNode[]): void {
  let changed = true;

  while (changed) {
    changed =
      trimUnreachableStatements(body) || collapseLiteralConditionals(body) || removeRedundantExpressions(body);
  }
}

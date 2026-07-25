import { forEachNode, type AstNode } from "./AstTraversal";

function isIdentifierUsed(name: string, node: AstNode): boolean {
  let used = false;

  forEachNode(node, (candidate) => {
    if (candidate.type === "Identifier" && candidate.name === name) {
      used = true;
    }
  });

  return used;
}

function isIdentifierReassigned(name: string, node: AstNode): boolean {
  let reassigned = false;

  forEachNode(node, (candidate) => {
    if (candidate.type === "AssignmentExpression") {
      const left = candidate.left as AstNode;

      if (left.type === "Identifier" && left.name === name) {
        reassigned = true;
      }
    }

    if (candidate.type === "UpdateExpression") {
      const argument = candidate.argument as AstNode;

      if (argument.type === "Identifier" && argument.name === name) {
        reassigned = true;
      }
    }
  });

  return reassigned;
}

function isStableBound(bound: AstNode, body: AstNode): boolean {
  if (bound.type === "Literal" && typeof bound.value === "number") {
    return true;
  }

  if (bound.type === "Identifier") {
    return !isIdentifierReassigned(bound.name as string, body);
  }

  return false;
}

function golfCountingLoop(node: AstNode): void {
  if (node.type !== "ForStatement") {
    return;
  }

  const init = node.init as AstNode | null | undefined;
  const test = node.test as AstNode | null | undefined;
  const update = node.update as AstNode | null | undefined;
  const body = node.body as AstNode;

  if (init === null || init === undefined || init.type !== "VariableDeclaration") {
    return;
  }

  const declarations = init.declarations as AstNode[];

  if (declarations.length !== 1) {
    return;
  }

  const declarator = declarations[0];

  if (declarator === undefined) {
    return;
  }

  const id = declarator.id as AstNode;
  const declInit = declarator.init as AstNode | null | undefined;

  if (id.type !== "Identifier") {
    return;
  }

  if (declInit === null || declInit === undefined || declInit.type !== "Literal" || declInit.value !== 0) {
    return;
  }

  if (test === null || test === undefined || test.type !== "BinaryExpression" || test.operator !== "<") {
    return;
  }

  const testLeft = test.left as AstNode;

  if (testLeft.type !== "Identifier" || testLeft.name !== id.name) {
    return;
  }

  const bound = test.right as AstNode;

  if (update === null || update === undefined || update.type !== "UpdateExpression" || update.operator !== "++") {
    return;
  }

  const updateArgument = update.argument as AstNode;

  if (updateArgument.type !== "Identifier" || updateArgument.name !== id.name) {
    return;
  }

  const loopName = id.name as string;

  if (isIdentifierUsed(loopName, body)) {
    return;
  }

  if (!isStableBound(bound, body)) {
    return;
  }

  declarator.init = bound;
  node.test = { type: "UpdateExpression", operator: "--", prefix: false, argument: { type: "Identifier", name: loopName } };
  node.update = null;
}

export function golfLoops(ast: AstNode): void {
  forEachNode(ast, golfCountingLoop);
}

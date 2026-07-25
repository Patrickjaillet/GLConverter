import { forEachNode, type AstNode } from "./AstTraversal";

function unwrapSingleStatement(node: AstNode | null | undefined): AstNode | null {
  if (node === null || node === undefined) {
    return null;
  }

  if (node.type === "BlockStatement") {
    const body = node.body as AstNode[];

    if (body.length !== 1) {
      return null;
    }

    const only = body[0];
    return only === undefined ? null : only;
  }

  return node;
}

function isSameIdentifier(a: AstNode, b: AstNode): boolean {
  return a.type === "Identifier" && b.type === "Identifier" && a.name === b.name;
}

function golfIfElse(node: AstNode, test: AstNode, consequent: AstNode, alternate: AstNode): boolean {
  if (consequent.type === "ReturnStatement" && alternate.type === "ReturnStatement") {
    const consArgument = consequent.argument as AstNode | null;
    const altArgument = alternate.argument as AstNode | null;

    if (consArgument === null || altArgument === null) {
      return false;
    }

    node.type = "ReturnStatement";
    node.argument = { type: "ConditionalExpression", test, consequent: consArgument, alternate: altArgument };

    delete node.consequent;
    delete node.alternate;
    delete node.test;
    return true;
  }

  if (consequent.type === "ExpressionStatement" && alternate.type === "ExpressionStatement") {
    const consExpression = consequent.expression as AstNode;
    const altExpression = alternate.expression as AstNode;

    if (
      consExpression.type === "AssignmentExpression" &&
      altExpression.type === "AssignmentExpression" &&
      consExpression.operator === "=" &&
      altExpression.operator === "=" &&
      isSameIdentifier(consExpression.left as AstNode, altExpression.left as AstNode)
    ) {
      node.type = "ExpressionStatement";
      node.expression = {
        type: "AssignmentExpression",
        operator: "=",
        left: consExpression.left,
        right: {
          type: "ConditionalExpression",
          test,
          consequent: consExpression.right,
          alternate: altExpression.right
        }
      };

      delete node.consequent;
      delete node.alternate;
      delete node.test;
      return true;
    }

    node.type = "ExpressionStatement";
    node.expression = { type: "ConditionalExpression", test, consequent: consExpression, alternate: altExpression };

    delete node.consequent;
    delete node.alternate;
    delete node.test;
    return true;
  }

  return false;
}

function golfIfOnly(node: AstNode, test: AstNode, consequent: AstNode): boolean {
  if (consequent.type !== "ExpressionStatement") {
    return false;
  }

  const consExpression = consequent.expression as AstNode;

  node.type = "ExpressionStatement";
  node.expression = { type: "LogicalExpression", operator: "&&", left: test, right: consExpression };

  delete node.consequent;
  delete node.alternate;
  delete node.test;
  return true;
}

function golfConditional(node: AstNode): void {
  if (node.type !== "IfStatement") {
    return;
  }

  const test = node.test as AstNode;
  const rawAlternate = node.alternate as AstNode | null | undefined;
  const consequent = unwrapSingleStatement(node.consequent as AstNode);

  if (consequent === null) {
    return;
  }

  if (rawAlternate !== null && rawAlternate !== undefined) {
    const alternate = unwrapSingleStatement(rawAlternate);

    if (alternate === null) {
      return;
    }

    golfIfElse(node, test, consequent, alternate);
    return;
  }

  golfIfOnly(node, test, consequent);
}

export function golfConditionals(ast: AstNode): void {
  forEachNode(ast, golfConditional);
}

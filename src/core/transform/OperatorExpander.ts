import { forEachNode, type AstNode } from "./AstTraversal";

function isNegation(node: AstNode): boolean {
  return node.type === "UnaryExpression" && node.operator === "!" && node.prefix === true;
}

function expandDoubleNegation(node: AstNode): boolean {
  if (!isNegation(node)) {
    return false;
  }

  const argument = node.argument as AstNode;

  if (!isNegation(argument)) {
    return false;
  }

  const inner = argument.argument;

  node.type = "CallExpression";
  node.callee = { type: "Identifier", name: "Boolean" };
  node.arguments = [inner];

  delete node.operator;
  delete node.prefix;
  delete node.argument;
  return true;
}

function expandBooleanLiteral(node: AstNode): boolean {
  if (!isNegation(node)) {
    return false;
  }

  const argument = node.argument as AstNode;

  if (argument.type !== "Literal" || typeof argument.value !== "number") {
    return false;
  }

  if (argument.value !== 0 && argument.value !== 1) {
    return false;
  }

  const boolValue = argument.value === 0;

  node.type = "Literal";
  node.value = boolValue;
  node.raw = String(boolValue);

  delete node.operator;
  delete node.prefix;
  delete node.argument;
  return true;
}

export function expandOperators(ast: AstNode): void {
  forEachNode(ast, (node) => {
    if (!expandDoubleNegation(node)) {
      expandBooleanLiteral(node);
    }
  });
}

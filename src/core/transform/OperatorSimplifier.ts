import { forEachNode, type AstNode } from "./AstTraversal";

const compoundableOperators = new Set(["+", "-", "*", "/", "%", "&", "|", "^", "<<", ">>", ">>>", "**"]);

function simplifyBooleanLiteral(node: AstNode): void {
  if (node.type !== "Literal" || typeof node.value !== "boolean") {
    return;
  }

  const boolValue = node.value;

  node.type = "UnaryExpression";
  node.operator = "!";
  node.prefix = true;
  node.argument = { type: "Literal", value: boolValue ? 0 : 1, raw: boolValue ? "0" : "1" };

  delete node.value;
  delete node.raw;
}

function simplifyAssignment(node: AstNode): void {
  if (node.type !== "AssignmentExpression" || node.operator !== "=") {
    return;
  }

  const left = node.left as AstNode;
  const right = node.right as AstNode;

  if (left.type !== "Identifier" || right.type !== "BinaryExpression") {
    return;
  }

  const rightLeft = right.left as AstNode;

  if (rightLeft.type !== "Identifier" || rightLeft.name !== left.name) {
    return;
  }

  const rightRight = right.right as AstNode;
  const operator = right.operator as string;

  if ((operator === "+" || operator === "-") && rightRight.type === "Literal" && rightRight.value === 1) {
    node.type = "UpdateExpression";
    node.operator = operator === "+" ? "++" : "--";
    node.prefix = false;
    node.argument = left;

    delete node.left;
    delete node.right;
    return;
  }

  if (compoundableOperators.has(operator)) {
    node.operator = `${operator}=`;
    node.right = rightRight;
  }
}

export function simplifyOperators(ast: AstNode): void {
  forEachNode(ast, (node) => {
    simplifyBooleanLiteral(node);
    simplifyAssignment(node);
  });
}

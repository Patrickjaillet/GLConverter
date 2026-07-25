import { forEachNode, type AstNode } from "./AstTraversal";

function asBlock(statement: AstNode): AstNode {
  return { type: "BlockStatement", body: [statement] };
}

function expandReturnConditional(node: AstNode): boolean {
  if (node.type !== "ReturnStatement") {
    return false;
  }

  const argument = node.argument as AstNode | null | undefined;

  if (argument === null || argument === undefined || argument.type !== "ConditionalExpression") {
    return false;
  }

  const test = argument.test;
  const consequent = argument.consequent as AstNode;
  const alternate = argument.alternate as AstNode;

  node.type = "IfStatement";
  node.test = test;
  node.consequent = asBlock({ type: "ReturnStatement", argument: consequent });
  node.alternate = asBlock({ type: "ReturnStatement", argument: alternate });

  delete node.argument;
  return true;
}

function expandAssignmentConditional(node: AstNode): boolean {
  if (node.type !== "ExpressionStatement") {
    return false;
  }

  const expression = node.expression as AstNode;

  if (
    expression.type === "AssignmentExpression" &&
    expression.operator === "=" &&
    (expression.right as AstNode).type === "ConditionalExpression"
  ) {
    const conditional = expression.right as AstNode;
    const left = expression.left as AstNode;

    node.type = "IfStatement";
    node.test = conditional.test;
    node.consequent = asBlock({
      type: "ExpressionStatement",
      expression: { type: "AssignmentExpression", operator: "=", left, right: conditional.consequent }
    });
    node.alternate = asBlock({
      type: "ExpressionStatement",
      expression: { type: "AssignmentExpression", operator: "=", left, right: conditional.alternate }
    });

    delete node.expression;
    return true;
  }

  if (expression.type === "ConditionalExpression") {
    const test = expression.test;
    const consequent = expression.consequent as AstNode;
    const alternate = expression.alternate as AstNode;

    node.type = "IfStatement";
    node.test = test;
    node.consequent = asBlock({ type: "ExpressionStatement", expression: consequent });
    node.alternate = asBlock({ type: "ExpressionStatement", expression: alternate });

    delete node.expression;
    return true;
  }

  if (expression.type === "LogicalExpression" && expression.operator === "&&") {
    const test = expression.left;
    const consequent = expression.right as AstNode;

    node.type = "IfStatement";
    node.test = test;
    node.consequent = asBlock({ type: "ExpressionStatement", expression: consequent });
    node.alternate = null;

    delete node.expression;
    return true;
  }

  return false;
}

function expandConditional(node: AstNode): void {
  expandReturnConditional(node);
  expandAssignmentConditional(node);
}

export function expandConditionals(ast: AstNode): void {
  forEachNode(ast, expandConditional);
}

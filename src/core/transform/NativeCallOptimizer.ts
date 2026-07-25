import { forEachNode, type AstNode } from "./AstTraversal";

function isIdentifierNamed(node: AstNode | null | undefined, name: string): boolean {
  return node !== null && node !== undefined && node.type === "Identifier" && node.name === name;
}

function isNegativeOneLiteral(node: AstNode | null | undefined): boolean {
  if (node === null || node === undefined) {
    return false;
  }

  return node.type === "UnaryExpression" && node.operator === "-" && (node.argument as AstNode).type === "Literal" &&
    (node.argument as AstNode).value === 1;
}

function isIndexOfCall(node: AstNode | null | undefined): boolean {
  if (node === null || node === undefined || node.type !== "CallExpression") {
    return false;
  }

  const callee = node.callee as AstNode;
  return callee.type === "MemberExpression" && callee.computed !== true && isIdentifierNamed(callee.property as AstNode, "indexOf");
}

function toIncludesCall(indexOfCall: AstNode): { callee: AstNode; arguments: unknown } {
  const callee = indexOfCall.callee as AstNode;
  const newCallee: AstNode = {
    type: "MemberExpression",
    object: callee.object,
    property: { type: "Identifier", name: "includes" },
    computed: false,
    optional: false
  };

  return { callee: newCallee, arguments: indexOfCall.arguments };
}

function golfBooleanCall(node: AstNode): boolean {
  if (node.type !== "CallExpression") {
    return false;
  }

  const callee = node.callee as AstNode;
  const args = node.arguments as AstNode[];

  if (!isIdentifierNamed(callee, "Boolean") || args.length !== 1) {
    return false;
  }

  const argument = args[0];

  if (argument === undefined) {
    return false;
  }

  node.type = "UnaryExpression";
  node.operator = "!";
  node.prefix = true;
  node.argument = { type: "UnaryExpression", operator: "!", prefix: true, argument };

  delete node.callee;
  delete node.arguments;
  return true;
}

function golfIndexOfComparison(node: AstNode): boolean {
  if (node.type !== "BinaryExpression") {
    return false;
  }

  const left = node.left as AstNode;
  const right = node.right as AstNode;
  const operator = node.operator as string;

  if (!isIndexOfCall(left) || !isNegativeOneLiteral(right)) {
    return false;
  }

  const converted = toIncludesCall(left);

  if (operator === "!==" || operator === "!=") {
    node.type = "CallExpression";
    node.callee = converted.callee;
    node.arguments = converted.arguments;

    delete node.left;
    delete node.right;
    delete node.operator;
    return true;
  }

  if (operator === "===" || operator === "==") {
    node.type = "UnaryExpression";
    node.operator = "!";
    node.prefix = true;
    node.argument = { type: "CallExpression", callee: converted.callee, arguments: converted.arguments };

    delete node.left;
    delete node.right;
    return true;
  }

  return false;
}

function golfArrayPrototype(node: AstNode): boolean {
  if (node.type !== "MemberExpression" || node.computed === true) {
    return false;
  }

  const object = node.object as AstNode;
  const property = node.property as AstNode;

  if (!isIdentifierNamed(object, "Array") || !isIdentifierNamed(property, "prototype")) {
    return false;
  }

  node.type = "ArrayExpression";
  node.elements = [];

  delete node.object;
  delete node.property;
  delete node.computed;
  delete node.optional;
  return true;
}

function golfApplyCall(node: AstNode): boolean {
  if (node.type !== "CallExpression") {
    return false;
  }

  const callee = node.callee as AstNode;
  const args = node.arguments as AstNode[];

  if (callee.type !== "MemberExpression" || callee.computed === true || !isIdentifierNamed(callee.property as AstNode, "apply")) {
    return false;
  }

  if (args.length !== 2) {
    return false;
  }

  const thisArg = args[0];
  const spreadSource = args[1];

  if (thisArg === undefined || spreadSource === undefined) {
    return false;
  }

  const isNullish = (thisArg.type === "Literal" && thisArg.value === null) || isIdentifierNamed(thisArg, "undefined");

  if (!isNullish) {
    return false;
  }

  node.callee = callee.object;
  node.arguments = [{ type: "SpreadElement", argument: spreadSource }];
  return true;
}

export function golfNativeCalls(ast: AstNode): void {
  forEachNode(ast, (node) => {
    golfBooleanCall(node);
    golfIndexOfComparison(node);
    golfArrayPrototype(node);
    golfApplyCall(node);
  });
}

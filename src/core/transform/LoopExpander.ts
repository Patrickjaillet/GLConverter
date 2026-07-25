import { forEachNode, type AstNode } from "./AstTraversal";

function expandCountdownLoop(node: AstNode): boolean {
  if (node.type !== "ForStatement") {
    return false;
  }

  const init = node.init as AstNode | null | undefined;
  const test = node.test as AstNode | null | undefined;
  const update = node.update as AstNode | null | undefined;

  if (init === null || init === undefined || init.type !== "VariableDeclaration") {
    return false;
  }

  const declarations = init.declarations as AstNode[];

  if (declarations.length !== 1) {
    return false;
  }

  const declarator = declarations[0];

  if (declarator === undefined) {
    return false;
  }

  const id = declarator.id as AstNode;
  const bound = declarator.init as AstNode | null | undefined;

  if (id.type !== "Identifier" || bound === null || bound === undefined) {
    return false;
  }

  if (update !== null && update !== undefined) {
    return false;
  }

  if (test === null || test === undefined || test.type !== "UpdateExpression" || test.operator !== "--" || test.prefix !== false) {
    return false;
  }

  const testArgument = test.argument as AstNode;

  if (testArgument.type !== "Identifier" || testArgument.name !== id.name) {
    return false;
  }

  const loopName = id.name as string;

  declarator.init = { type: "Literal", value: 0, raw: "0" };
  node.test = { type: "BinaryExpression", operator: "<", left: { type: "Identifier", name: loopName }, right: bound };
  node.update = { type: "UpdateExpression", operator: "++", prefix: false, argument: { type: "Identifier", name: loopName } };

  return true;
}

export function expandLoops(ast: AstNode): void {
  forEachNode(ast, expandCountdownLoop);
}

import type { Program } from "acorn";
import { expandConditionals } from "./ConditionalExpander";
import { expandLoops } from "./LoopExpander";
import { expandOperators } from "./OperatorExpander";
import { normalizeBlocks } from "./BlockNormalizer";
import { applyDescriptiveRenaming } from "./DescriptiveRenamer";
import type { AstNode } from "./AstTraversal";

export function applyDegolfTransforms(ast: Program): void {
  expandConditionals(ast as unknown as AstNode);
  expandLoops(ast as unknown as AstNode);
  expandOperators(ast as unknown as AstNode);
  normalizeBlocks(ast as unknown as AstNode);
  applyDescriptiveRenaming(ast);
}

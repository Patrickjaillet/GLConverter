import { parse, tokenizer, type Token } from "acorn";
import type { Program } from "acorn";

export interface ParseResult {
  ast: Program | null;
  tokens: Token[];
  tokenCount: number;
  errorMessage: string | null;
}

export const acornOptions = {
  ecmaVersion: "latest" as const,
  sourceType: "script" as const,
  ranges: true as const
};

export function parseSource(source: string): ParseResult {
  if (source.trim().length === 0) {
    return { ast: null, tokens: [], tokenCount: 0, errorMessage: null };
  }

  const tokens: Token[] = [];

  try {
    for (const token of tokenizer(source, acornOptions)) {
      tokens.push(token);
    }

    const ast = parse(source, acornOptions);

    return { ast, tokens, tokenCount: tokens.length, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    return { ast: null, tokens, tokenCount: tokens.length, errorMessage: message };
  }
}

import { generate } from "astring";
import type { Program } from "acorn";

function compactWhitespace(code: string): string {
  let output = code
    .replace(/}\s*else\s*{/g, "}else{")
    .replace(/}\s*else\s*if\s*\(/g, "}else if(")
    .replace(/\btry\s*{/g, "try{")
    .replace(/\bdo\s*{/g, "do{")
    .replace(/\bfunction\s*\(/g, "function(")
    .replace(/\)\s*{/g, "){")
    .replace(/\bif\s*\(/g, "if(")
    .replace(/\bfor\s*\(/g, "for(")
    .replace(/\bwhile\s*\(/g, "while(")
    .replace(/\bswitch\s*\(/g, "switch(")
    .replace(/\bcatch\s*\(/g, "catch(");

  let previous: string;

  do {
    previous = output;
    output = output.replace(/;}/g, "}");
  } while (output !== previous);

  return output.trim();
}

export function generateMinified(ast: Program): string {
  const raw = generate(ast, { indent: "", lineEnd: "" });
  return compactWhitespace(raw);
}

export function generateJustified(ast: Program): string {
  return generate(ast, { indent: "  ", lineEnd: "\n" }).trim();
}

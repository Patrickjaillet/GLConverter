import { describe, it, expect } from "vitest";
import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "../Parser";
import { generateJustified } from "../CodeGenerator";
import { applyDegolfTransforms } from "./DegolfPipeline";

function degolf(source: string): string {
  const ast = parse(source, acornOptions) as Program;
  applyDegolfTransforms(ast);
  return generateJustified(ast);
}

describe("applyDegolfTransforms", () => {
  it("expands a ternary return into an if/else with explicit return statements", () => {
    const output = degolf("function f(x){return x?1:2;}");

    expect(output).toBe("function func1(param1) {\n  if (param1) {\n    return 1;\n  } else {\n    return 2;\n  }\n}");
  });

  it("expands a ternary assignment into an if/else", () => {
    const output = degolf("function f(x){let y;y=x?1:2;}");

    expect(output).toBe(
      "function func1(param1) {\n  let value1;\n  if (param1) {\n    value1 = 1;\n  } else {\n    value1 = 2;\n  }\n}"
    );
  });

  it("expands a bare conditional expression statement into an if/else", () => {
    const output = degolf("x?f():g();");

    expect(output).toBe("if (x) {\n  f();\n} else {\n  g();\n}");
  });

  it("expands the && shortcut into an if statement", () => {
    const output = degolf("x&&f();");

    expect(output).toBe("if (x) {\n  f();\n}");
  });

  it("expands a countdown loop back into an ascending counting loop", () => {
    const output = degolf("for(let i=10;i--;){f();}");

    expect(output).toBe("for (let index1 = 0; index1 < 10; index1++) {\n  f();\n}");
  });

  it("preserves the loop counter role when it is used inside the loop body", () => {
    const output = degolf("for(let i=10;i--;){f(i);}");

    expect(output).toBe("for (let index1 = 0; index1 < 10; index1++) {\n  f(index1);\n}");
  });

  it("expands double negation back into a Boolean() call", () => {
    const output = degolf("const y=!!x;");

    expect(output).toBe("const value1 = Boolean(x);");
  });

  it("expands the !0 / !1 shortcuts back into boolean literals", () => {
    const truthy = degolf("const a=!0;");
    const falsy = degolf("const a=!1;");

    expect(truthy).toBe("const value1 = true;");
    expect(falsy).toBe("const value1 = false;");
  });

  it("wraps a single-statement if body in a block", () => {
    const output = degolf("if(x)f();");

    expect(output).toBe("if (x) {\n  f();\n}");
  });

  it("restores descriptive names for parameters, values, and return values", () => {
    const output = degolf("function a(b){const c=b;return c;}");

    expect(output).toBe("function func1(param1) {\n  const value1 = param1;\n  return value1;\n}");
  });

  it("leaves already-structured code unaffected", () => {
    const source = "function greet(name) {\n  if (name) {\n    return name;\n  } else {\n    return \"anonymous\";\n  }\n}";
    const ast = parse(source, acornOptions) as Program;
    applyDegolfTransforms(ast);
    const output = generateJustified(ast);

    expect(output).toContain("if (");
    expect(output).toContain("return");
  });
});

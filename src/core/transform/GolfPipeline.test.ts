import { describe, it, expect } from "vitest";
import { parse } from "acorn";
import type { Program } from "acorn";
import { acornOptions } from "../Parser";
import { generateMinified } from "../CodeGenerator";
import { applyGolfTransforms } from "./GolfPipeline";
import { defaultGolfRules, type GolfRules } from "./GolfRules";

function golf(source: string, rules: GolfRules = defaultGolfRules): string {
  const ast = parse(source, acornOptions) as Program;
  applyGolfTransforms(ast, rules);
  return generateMinified(ast);
}

describe("applyGolfTransforms", () => {
  it("eliminates dead code following a return statement", () => {
    const output = golf("function f(){return 1;const x=2;}", {
      ...defaultGolfRules,
      variableRenaming: false
    });

    expect(output).toBe("function f(){return 1}");
  });

  it("collapses an if statement with a literal true test", () => {
    const output = golf("if(true){f();}else{g();}", {
      ...defaultGolfRules,
      variableRenaming: false,
      ternaryGolfing: false
    });

    expect(output).toBe("f();");
  });

  it("merges adjacent variable declarations of the same kind", () => {
    const output = golf("let a=1;let b=2;", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("let a = 1, b = 2;");
  });

  it("rewrites an ascending counting loop as a countdown loop when the counter is unused", () => {
    const output = golf("for(let i=0;i<10;i++){f();}", {
      ...defaultGolfRules,
      variableRenaming: false
    });

    expect(output).toBe("for(let i = 10; i--;){f()}");
  });

  it("does not golf a counting loop when the counter is used in the body", () => {
    const output = golf("for(let i=0;i<10;i++){f(i);}", {
      ...defaultGolfRules,
      variableRenaming: false
    });

    expect(output).toBe("for(let i = 0; i < 10; i++){f(i)}");
  });

  it("rewrites matching if/else return statements as a ternary", () => {
    const output = golf("function f(x){if(x){return 1;}else{return 2;}}", {
      ...defaultGolfRules,
      variableRenaming: false
    });

    expect(output).toBe("function f(x){return x ? 1 : 2}");
  });

  it("rewrites a single-branch if with an expression body using the && shortcut", () => {
    const output = golf("if(x){f();}", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("x && f();");
  });

  it("rewrites Boolean(x) as double negation", () => {
    const output = golf("const y=Boolean(x);", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("const y = !!x;");
  });

  it("rewrites indexOf presence checks as includes", () => {
    const notFound = golf("const has=arr.indexOf(x)!==-1;", {
      ...defaultGolfRules,
      variableRenaming: false
    });
    const notPresent = golf("const has=arr.indexOf(x)===-1;", {
      ...defaultGolfRules,
      variableRenaming: false
    });

    expect(notFound).toBe("const has = arr.includes(x);");
    expect(notPresent).toBe("const has = !arr.includes(x);");
  });

  it("rewrites Array.prototype as an empty array literal", () => {
    const output = golf("const p=Array.prototype;", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("const p = [];");
  });

  it("rewrites .apply(null, args) calls using spread syntax", () => {
    const output = golf("f.apply(null,args);", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("f(...args);");
  });

  it("renames variables to short identifiers avoiding reserved words", () => {
    const output = golf("function greet(name){const message=name;return message;}");

    expect(output).toBe("function a(b){const c = b;return c}");
  });

  it("simplifies x = x + 1 into an increment expression", () => {
    const output = golf("x=x+1;", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("x++;");
  });

  it("simplifies compound arithmetic assignments", () => {
    const output = golf("x=x*2;", { ...defaultGolfRules, variableRenaming: false });

    expect(output).toBe("x *= 2;");
  });

  it("simplifies boolean literals to their shortest form", () => {
    const outputTrue = golf("const a=true;", { ...defaultGolfRules, variableRenaming: false });
    const outputFalse = golf("const a=false;", { ...defaultGolfRules, variableRenaming: false });

    expect(outputTrue).toBe("const a = !0;");
    expect(outputFalse).toBe("const a = !1;");
  });

  it("respects disabled rules and leaves the AST untouched for that technique", () => {
    const output = golf("for(let i=0;i<10;i++){f();}", {
      ...defaultGolfRules,
      loopGolfing: false,
      variableRenaming: false
    });

    expect(output).toBe("for(let i = 0; i < 10; i++){f()}");
  });
});

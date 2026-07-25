import { describe, it, expect } from "vitest";
import { engineManager, ActiveEngine } from "./EngineManager";

describe("engineManager", () => {
  it("is not initialized before initialize() is called", () => {
    expect(engineManager.isInitialized()).toBe(false);
  });

  it("falls back to the JS engine when the WASM module is unavailable", async () => {
    await engineManager.initialize();

    expect(engineManager.isInitialized()).toBe(true);
    expect(engineManager.getActiveEngine()).toBe(ActiveEngine.Js);
    expect(engineManager.getEngineVersion()).toBe("js-fallback");
  });

  it("remains initialized and consistent across repeated initialize() calls", async () => {
    await engineManager.initialize();
    await engineManager.initialize();

    expect(engineManager.isInitialized()).toBe(true);
    expect(engineManager.getActiveEngine()).toBe(ActiveEngine.Js);
  });

  it("compacts whitespace using the JS engine", async () => {
    await engineManager.initialize();

    const compacted = engineManager.compactWhitespace("if ( x ) { f(); }");

    expect(compacted).toBe("if( x ){ f(); }");
  });

  it("counts tokens using the JS engine", async () => {
    await engineManager.initialize();

    const count = engineManager.countTokens("const a = 1;");

    expect(count).toBeGreaterThan(0);
  });
});

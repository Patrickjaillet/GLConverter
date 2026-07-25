import { compactWhitespace as compactWhitespaceJs } from "./CodeGenerator";
import { parseSource } from "./Parser";
import { loadWasmEngine, type WasmEngineModule } from "./wasm/WasmEngineLoader";

export enum ActiveEngine {
  Wasm = "wasm",
  Js = "js"
}

class EngineManager {
  private wasmEngine: WasmEngineModule | null;
  private initialized: boolean;
  private initPromise: Promise<void> | null;

  constructor() {
    this.wasmEngine = null;
    this.initialized = false;
    this.initPromise = null;
  }

  public async initialize(): Promise<void> {
    if (this.initPromise !== null) {
      return this.initPromise;
    }

    this.initPromise = loadWasmEngine().then((engine) => {
      this.wasmEngine = engine;
      this.initialized = true;
    });

    return this.initPromise;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getActiveEngine(): ActiveEngine {
    return this.wasmEngine !== null ? ActiveEngine.Wasm : ActiveEngine.Js;
  }

  public getEngineVersion(): string {
    return this.wasmEngine !== null ? this.wasmEngine.engineVersion() : "js-fallback";
  }

  public compactWhitespace(source: string): string {
    if (this.wasmEngine !== null) {
      return this.wasmEngine.compactWhitespace(source);
    }

    return compactWhitespaceJs(source);
  }

  public countTokens(source: string): number {
    if (this.wasmEngine !== null) {
      return this.wasmEngine.countTokens(source);
    }

    return parseSource(source).tokenCount;
  }
}

export const engineManager = new EngineManager();

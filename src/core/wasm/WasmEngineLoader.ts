export interface WasmEngineModule {
  engineVersion(): string;
  compactWhitespace(source: string): string;
  countTokens(source: string): number;
}

interface WasmModuleExports {
  default: (input?: unknown) => Promise<unknown>;
  engine_version: () => string;
  compact_whitespace: (source: string) => string;
  count_tokens: (source: string) => number;
}

export async function loadWasmEngine(): Promise<WasmEngineModule | null> {
  try {
    const moduleUrl = "../../wasm/pkg/glconverter_engine.js";
    const wasmModule = (await import(/* @vite-ignore */ moduleUrl)) as WasmModuleExports;
    await wasmModule.default();

    return {
      engineVersion: () => wasmModule.engine_version(),
      compactWhitespace: (source: string) => wasmModule.compact_whitespace(source),
      countTokens: (source: string) => wasmModule.count_tokens(source)
    };
  } catch {
    return null;
  }
}

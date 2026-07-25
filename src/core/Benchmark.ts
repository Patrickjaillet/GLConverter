import { compactWhitespace as compactWhitespaceJs } from "./CodeGenerator";
import { parseSource } from "./Parser";
import { engineManager, ActiveEngine } from "./EngineManager";

export interface BenchmarkTaskResult {
  label: string;
  jsDurationMs: number;
  wasmDurationMs: number | null;
  speedup: number | null;
}

export interface BenchmarkReport {
  activeEngine: ActiveEngine;
  wasmAvailable: boolean;
  iterations: number;
  tasks: BenchmarkTaskResult[];
}

function timeIterations(iterations: number, run: () => void): number {
  const start = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    run();
  }

  const end = performance.now();
  return end - start;
}

export function runBenchmark(source: string, iterations: number = 200): BenchmarkReport {
  const wasmAvailable = engineManager.getActiveEngine() === ActiveEngine.Wasm;

  const compactJsDuration = timeIterations(iterations, () => {
    compactWhitespaceJs(source);
  });

  const tokenizeJsDuration = timeIterations(iterations, () => {
    parseSource(source);
  });

  const compactTask: BenchmarkTaskResult = {
    label: "Whitespace compaction",
    jsDurationMs: compactJsDuration,
    wasmDurationMs: null,
    speedup: null
  };

  const tokenizeTask: BenchmarkTaskResult = {
    label: "Lexical tokenization",
    jsDurationMs: tokenizeJsDuration,
    wasmDurationMs: null,
    speedup: null
  };

  if (wasmAvailable) {
    const compactWasmDuration = timeIterations(iterations, () => {
      engineManager.compactWhitespace(source);
    });

    const tokenizeWasmDuration = timeIterations(iterations, () => {
      engineManager.countTokens(source);
    });

    compactTask.wasmDurationMs = compactWasmDuration;
    compactTask.speedup = compactWasmDuration === 0 ? null : compactJsDuration / compactWasmDuration;

    tokenizeTask.wasmDurationMs = tokenizeWasmDuration;
    tokenizeTask.speedup = tokenizeWasmDuration === 0 ? null : tokenizeJsDuration / tokenizeWasmDuration;
  }

  return {
    activeEngine: engineManager.getActiveEngine(),
    wasmAvailable,
    iterations,
    tasks: [compactTask, tokenizeTask]
  };
}

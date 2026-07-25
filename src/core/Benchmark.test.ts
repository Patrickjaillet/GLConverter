import { describe, it, expect } from "vitest";
import { runBenchmark } from "./Benchmark";
import { engineManager, ActiveEngine } from "./EngineManager";

describe("runBenchmark", () => {
  it("reports the JS engine as active when WASM has not been built", async () => {
    await engineManager.initialize();

    const report = runBenchmark("const a = 1;", 5);

    expect(report.activeEngine).toBe(ActiveEngine.Js);
    expect(report.wasmAvailable).toBe(false);
  });

  it("runs the requested number of iterations", () => {
    const report = runBenchmark("const a = 1;", 10);

    expect(report.iterations).toBe(10);
  });

  it("produces a whitespace compaction and a tokenization task with non-negative durations", () => {
    const report = runBenchmark("function f(x){return x;}", 5);

    expect(report.tasks).toHaveLength(2);
    expect(report.tasks[0]?.label).toBe("Whitespace compaction");
    expect(report.tasks[1]?.label).toBe("Lexical tokenization");

    for (const task of report.tasks) {
      expect(task.jsDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("leaves WASM duration and speedup null when WASM is unavailable", () => {
    const report = runBenchmark("const a = 1;", 5);

    for (const task of report.tasks) {
      expect(task.wasmDurationMs).toBeNull();
      expect(task.speedup).toBeNull();
    }
  });

  it("defaults to 200 iterations when none is specified", () => {
    const report = runBenchmark("const a = 1;");

    expect(report.iterations).toBe(200);
  });
});

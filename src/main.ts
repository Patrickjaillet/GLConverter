import { BackgroundScene } from "./ui/BackgroundScene";
import { EditorPane } from "./ui/EditorPane";
import {
  ConversionEngine,
  ConversionMode,
  ConversionDirection,
  EquivalenceStatus,
  type ConversionResult
} from "./core/ConversionEngine";
import { detectLanguage } from "./core/LanguageDetector";
import { parseSource } from "./core/Parser";
import { defaultGolfRules, golfRuleDescriptors, type GolfRules } from "./core/transform/GolfRules";
import { engineManager, ActiveEngine } from "./core/EngineManager";
import { runBenchmark, type BenchmarkReport } from "./core/Benchmark";

const sampleSource = [
  "function greet(name) {",
  "  const message = \"Hello, \" + name + \"!\";",
  "  console.log(message);",
  "  return message;",
  "}",
  "",
  "greet(\"world\");"
].join("\n");

const modeLabels: Record<ConversionMode, string> = {
  [ConversionMode.Minified]: "Minified",
  [ConversionMode.Justified]: "Justified"
};

const directionLabels: Record<ConversionDirection, string> = {
  [ConversionDirection.Golf]: "Golf",
  [ConversionDirection.Degolf]: "De-golf"
};

const equivalenceLabels: Record<EquivalenceStatus, string> = {
  [EquivalenceStatus.Verified]: "Equivalence: Verified",
  [EquivalenceStatus.Uncertain]: "Equivalence: Uncertain",
  [EquivalenceStatus.NotChecked]: "Equivalence: \u2014"
};

const engineLabels: Record<ActiveEngine, string> = {
  [ActiveEngine.Wasm]: "Engine: WASM",
  [ActiveEngine.Js]: "Engine: JS (fallback)"
};

class Application {
  private readonly conversionEngine: ConversionEngine;
  private originalPane: EditorPane | null;
  private convertedPane: EditorPane | null;
  private isSyncing: boolean;
  private currentMode: ConversionMode;
  private currentDirection: ConversionDirection;
  private rules: GolfRules;

  constructor() {
    this.conversionEngine = new ConversionEngine();
    this.originalPane = null;
    this.convertedPane = null;
    this.isSyncing = false;
    this.currentMode = ConversionMode.Minified;
    this.currentDirection = ConversionDirection.Golf;
    this.rules = { ...defaultGolfRules };
  }

  public async mount(): Promise<void> {
    this.mountBackground();
    await engineManager.initialize();
    this.updateEngineBadge();
    this.mountEditors();
    this.mountModeToggle();
    this.mountDirectionToggle();
    this.mountRulesPanel();
    this.mountBenchmarkPanel();
    this.updateDirectionVisibility();

    const result = this.conversionEngine.convert(sampleSource, this.currentMode, this.rules, this.currentDirection);
    this.refreshStatus(sampleSource, result);
  }

  private updateEngineBadge(): void {
    const engineBadge = document.getElementById("engine-badge");

    if (engineBadge !== null) {
      engineBadge.textContent = engineLabels[engineManager.getActiveEngine()];
    }
  }

  private mountBackground(): void {
    const canvas = document.getElementById("background-canvas") as HTMLCanvasElement | null;

    if (canvas === null) {
      return;
    }

    const backgroundScene = new BackgroundScene(canvas);
    backgroundScene.start();
  }

  private mountEditors(): void {
    const originalMount = document.getElementById("editor-original");
    const convertedMount = document.getElementById("editor-converted");

    if (originalMount === null || convertedMount === null) {
      return;
    }

    this.originalPane = new EditorPane({
      parent: originalMount,
      initialContent: sampleSource,
      readOnly: false,
      onChange: (content) => this.handleOriginalChange(content)
    });

    const initialResult = this.conversionEngine.convert(
      sampleSource,
      this.currentMode,
      this.rules,
      this.currentDirection
    );

    this.convertedPane = new EditorPane({
      parent: convertedMount,
      initialContent: initialResult.code,
      readOnly: true
    });
  }

  private mountModeToggle(): void {
    const toggleButton = document.getElementById("mode-toggle") as HTMLButtonElement | null;

    if (toggleButton === null) {
      return;
    }

    toggleButton.textContent = modeLabels[this.currentMode];
    toggleButton.addEventListener("click", () => this.handleModeToggle(toggleButton));
  }

  private mountDirectionToggle(): void {
    const toggleButton = document.getElementById("direction-toggle") as HTMLButtonElement | null;

    if (toggleButton === null) {
      return;
    }

    toggleButton.textContent = directionLabels[this.currentDirection];
    toggleButton.addEventListener("click", () => this.handleDirectionToggle(toggleButton));
  }

  private updateDirectionVisibility(): void {
    const modeToggle = document.getElementById("mode-toggle") as HTMLButtonElement | null;
    const rulesWidget = document.querySelector(".rules-widget") as HTMLElement | null;
    const equivalenceBadge = document.getElementById("equivalence-badge");
    const isDegolf = this.currentDirection === ConversionDirection.Degolf;

    if (modeToggle !== null) {
      modeToggle.hidden = isDegolf;
    }

    if (rulesWidget !== null) {
      rulesWidget.hidden = isDegolf;
    }

    if (equivalenceBadge !== null) {
      equivalenceBadge.hidden = !isDegolf;
    }
  }

  private handleDirectionToggle(toggleButton: HTMLButtonElement): void {
    this.currentDirection =
      this.currentDirection === ConversionDirection.Golf ? ConversionDirection.Degolf : ConversionDirection.Golf;

    toggleButton.textContent = directionLabels[this.currentDirection];
    this.updateDirectionVisibility();

    const content = this.originalPane?.getContent() ?? sampleSource;
    const result = this.renderConverted(content);
    this.refreshStatus(content, result);
  }

  private mountRulesPanel(): void {
    const toggleButton = document.getElementById("rules-toggle") as HTMLButtonElement | null;
    const panel = document.getElementById("rules-panel");

    if (toggleButton === null || panel === null) {
      return;
    }

    for (const descriptor of golfRuleDescriptors) {
      const item = document.createElement("label");
      item.className = "rules-panel-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.rules[descriptor.key];
      checkbox.addEventListener("change", () => this.handleRuleChange(descriptor.key, checkbox.checked));

      const text = document.createElement("span");
      text.textContent = descriptor.label;

      item.appendChild(checkbox);
      item.appendChild(text);
      panel.appendChild(item);
    }

    toggleButton.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });

    document.addEventListener("click", (event) => {
      const target = event.target as Node;

      if (!panel.hidden && !panel.contains(target) && target !== toggleButton) {
        panel.hidden = true;
      }
    });
  }

  private handleRuleChange(key: keyof GolfRules, value: boolean): void {
    this.rules = { ...this.rules, [key]: value };

    const content = this.originalPane?.getContent() ?? sampleSource;
    const result = this.renderConverted(content);
    this.refreshStatus(content, result);
  }

  private mountBenchmarkPanel(): void {
    const toggleButton = document.getElementById("benchmark-toggle") as HTMLButtonElement | null;
    const panel = document.getElementById("benchmark-panel");

    if (toggleButton === null || panel === null) {
      return;
    }

    toggleButton.addEventListener("click", () => {
      panel.hidden = !panel.hidden;

      if (!panel.hidden) {
        this.renderBenchmark(panel);
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target as Node;

      if (!panel.hidden && !panel.contains(target) && target !== toggleButton) {
        panel.hidden = true;
      }
    });
  }

  private renderBenchmark(panel: HTMLElement): void {
    panel.innerHTML = "";

    const title = document.createElement("div");
    title.className = "benchmark-panel-title";
    title.textContent = "Engine benchmark";
    panel.appendChild(title);

    const status = document.createElement("div");
    status.className = "benchmark-panel-status";
    status.textContent = "Running...";
    panel.appendChild(status);

    const content = this.originalPane?.getContent() ?? sampleSource;
    const report = runBenchmark(content);

    status.textContent = report.wasmAvailable
      ? `Active engine: WASM \u2014 ${report.iterations} iterations`
      : `Active engine: JS fallback (WASM not built) \u2014 ${report.iterations} iterations`;

    for (const task of report.tasks) {
      panel.appendChild(this.buildBenchmarkTaskElement(task));
    }
  }

  private buildBenchmarkTaskElement(task: BenchmarkReport["tasks"][number]): HTMLElement {
    const container = document.createElement("div");
    container.className = "benchmark-task";

    const label = document.createElement("div");
    label.className = "benchmark-task-label";
    label.textContent = task.label;
    container.appendChild(label);

    const maxDuration = Math.max(task.jsDurationMs, task.wasmDurationMs ?? 0, 0.001);

    container.appendChild(this.buildBenchmarkBarRow("JS", task.jsDurationMs, maxDuration));

    if (task.wasmDurationMs !== null) {
      container.appendChild(this.buildBenchmarkBarRow("WASM", task.wasmDurationMs, maxDuration));
    }

    if (task.speedup !== null) {
      const speedup = document.createElement("div");
      speedup.className = "benchmark-speedup";
      speedup.textContent = `WASM is ${task.speedup.toFixed(2)}x the JS speed`;
      container.appendChild(speedup);
    }

    return container;
  }

  private buildBenchmarkBarRow(name: string, durationMs: number, maxDuration: number): HTMLElement {
    const row = document.createElement("div");
    row.className = "benchmark-bar-row";

    const label = document.createElement("span");
    label.className = "benchmark-bar-name";
    label.textContent = name;

    const track = document.createElement("div");
    track.className = "benchmark-bar-track";

    const fill = document.createElement("div");
    fill.className = "benchmark-bar-fill";
    const ratio = maxDuration === 0 ? 0 : Math.min(100, (durationMs / maxDuration) * 100);
    fill.style.width = `${ratio}%`;
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "benchmark-bar-value";
    value.textContent = `${durationMs.toFixed(2)} ms`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);

    return row;
  }

  private handleModeToggle(toggleButton: HTMLButtonElement): void {
    this.currentMode =
      this.currentMode === ConversionMode.Minified ? ConversionMode.Justified : ConversionMode.Minified;

    toggleButton.textContent = modeLabels[this.currentMode];

    const content = this.originalPane?.getContent() ?? sampleSource;
    const result = this.renderConverted(content);
    this.refreshStatus(content, result);
  }

  private handleOriginalChange(content: string): void {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    const result = this.renderConverted(content);
    this.refreshStatus(content, result);
    this.isSyncing = false;
  }

  private renderConverted(content: string): ConversionResult {
    const result = this.conversionEngine.convert(content, this.currentMode, this.rules, this.currentDirection);
    this.convertedPane?.setContent(result.code);
    return result;
  }

  public dispose(): void {
    this.originalPane?.destroy();
    this.convertedPane?.destroy();
  }

  private refreshStatus(content: string, result: ConversionResult): void {
    const language = detectLanguage(content);
    const parseResult = parseSource(content);

    const languageBadge = document.getElementById("language-badge");
    const tokenBadge = document.getElementById("token-badge");
    const lengthBadge = document.getElementById("length-badge");
    const compressionBadge = document.getElementById("compression-badge");
    const equivalenceBadge = document.getElementById("equivalence-badge");

    if (languageBadge !== null) {
      languageBadge.textContent = `Language: ${language}`;
    }

    if (tokenBadge !== null) {
      const suffix = parseResult.errorMessage !== null ? " (parse error)" : "";
      tokenBadge.textContent = `Tokens: ${parseResult.tokenCount}${suffix}`;
    }

    if (lengthBadge !== null) {
      lengthBadge.textContent = `Characters: ${result.originalLength} \u2192 ${result.convertedLength}`;
    }

    if (compressionBadge !== null) {
      const ratio = result.errorMessage !== null ? 0 : result.compressionRatio;
      compressionBadge.textContent = `Compression: ${ratio.toFixed(1)}%`;
    }

    if (equivalenceBadge !== null) {
      equivalenceBadge.textContent = equivalenceLabels[result.equivalence];
    }
  }
}

function bootstrap(): void {
  const app = new Application();
  void app.mount();
}

document.addEventListener("DOMContentLoaded", bootstrap);

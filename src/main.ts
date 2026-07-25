import type { BackgroundScene } from "./ui/BackgroundScene";
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
import type { BenchmarkReport } from "./core/Benchmark";
import { HistoryStore, type HistoryEntry } from "./core/HistoryStore";
import { readFileAsText, downloadTextFile, copyToClipboard } from "./ui/FileTransfer";

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

export class Application {
  private readonly conversionEngine: ConversionEngine;
  private originalPane: EditorPane | null;
  private convertedPane: EditorPane | null;
  private backgroundScene: BackgroundScene | null;
  private isSyncing: boolean;
  private currentMode: ConversionMode;
  private currentDirection: ConversionDirection;
  private rules: GolfRules;
  private readonly historyStore: HistoryStore;
  private historyDebounceTimer: number | undefined;

  constructor() {
    this.conversionEngine = new ConversionEngine();
    this.originalPane = null;
    this.convertedPane = null;
    this.backgroundScene = null;
    this.isSyncing = false;
    this.currentMode = ConversionMode.Minified;
    this.currentDirection = ConversionDirection.Golf;
    this.rules = { ...defaultGolfRules };
    this.historyStore = new HistoryStore();
    this.historyDebounceTimer = undefined;
  }

  public async mount(): Promise<void> {
    this.mountBackground();
    this.updateVersionBadge();
    await engineManager.initialize();
    this.updateEngineBadge();
    this.mountEditors();
    this.mountModeToggle();
    this.mountDirectionToggle();
    this.mountRulesPanel();
    this.mountBenchmarkPanel();
    this.mountHistoryPanel();
    this.mountEditingControls();
    this.mountImportControls();
    this.mountExportAndCopyControls();
    this.mountKeyboardShortcuts();
    this.updateDirectionVisibility();

    const result = this.conversionEngine.convert(sampleSource, this.currentMode, this.rules, this.currentDirection);
    this.refreshStatus(sampleSource, result);
  }

  private updateVersionBadge(): void {
    const versionBadge = document.getElementById("version-badge");

    if (versionBadge !== null) {
      versionBadge.textContent = `v${__APP_VERSION__}`;
    }
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

    void import("./ui/BackgroundScene").then(({ BackgroundScene }) => {
      this.backgroundScene = new BackgroundScene(canvas);
      this.backgroundScene.start();
    });
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

    void import("./core/Benchmark").then(({ runBenchmark }) => {
      const report = runBenchmark(content);

      status.textContent = report.wasmAvailable
        ? `Active engine: WASM \u2014 ${report.iterations} iterations`
        : `Active engine: JS fallback (WASM not built) \u2014 ${report.iterations} iterations`;

      for (const task of report.tasks) {
        panel.appendChild(this.buildBenchmarkTaskElement(task));
      }
    });
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

  private mountEditingControls(): void {
    const undoButton = document.getElementById("undo-toggle") as HTMLButtonElement | null;
    const redoButton = document.getElementById("redo-toggle") as HTMLButtonElement | null;

    undoButton?.addEventListener("click", () => this.originalPane?.undo());
    redoButton?.addEventListener("click", () => this.originalPane?.redo());
  }

  private mountImportControls(): void {
    const importButton = document.getElementById("import-toggle") as HTMLButtonElement | null;
    const importInput = document.getElementById("import-input") as HTMLInputElement | null;
    const dropzone = document.getElementById("editor-original");

    if (importButton !== null && importInput !== null) {
      importButton.addEventListener("click", () => importInput.click());

      importInput.addEventListener("change", () => {
        const file = importInput.files?.[0];

        if (file !== undefined) {
          void this.importFile(file);
        }

        importInput.value = "";
      });
    }

    if (dropzone === null) {
      return;
    }

    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("editor-mount-dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("editor-mount-dragover");
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("editor-mount-dragover");

      const file = event.dataTransfer?.files?.[0];

      if (file !== undefined) {
        void this.importFile(file);
      }
    });
  }

  private async importFile(file: File): Promise<void> {
    const content = await readFileAsText(file);
    this.originalPane?.setContent(content);
  }

  private mountExportAndCopyControls(): void {
    const copyButton = document.getElementById("copy-toggle") as HTMLButtonElement | null;
    const exportToggle = document.getElementById("export-toggle") as HTMLButtonElement | null;
    const exportPanel = document.getElementById("export-panel");
    const exportJsButton = document.getElementById("export-js") as HTMLButtonElement | null;
    const exportTxtButton = document.getElementById("export-txt") as HTMLButtonElement | null;

    copyButton?.addEventListener("click", () => {
      const content = this.convertedPane?.getContent() ?? "";

      void copyToClipboard(content).then((success) => {
        if (copyButton === null) {
          return;
        }

        copyButton.textContent = success ? "Copied" : "Failed";
        window.setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1500);
      });
    });

    if (exportToggle === null || exportPanel === null) {
      return;
    }

    exportToggle.addEventListener("click", () => {
      exportPanel.hidden = !exportPanel.hidden;
    });

    exportJsButton?.addEventListener("click", () => {
      const content = this.convertedPane?.getContent() ?? "";
      downloadTextFile("glconverter-output.js", content, "text/javascript");
      exportPanel.hidden = true;
    });

    exportTxtButton?.addEventListener("click", () => {
      const content = this.convertedPane?.getContent() ?? "";
      downloadTextFile("glconverter-output.txt", content, "text/plain");
      exportPanel.hidden = true;
    });

    document.addEventListener("click", (event) => {
      const target = event.target as Node;

      if (!exportPanel.hidden && !exportPanel.contains(target) && target !== exportToggle) {
        exportPanel.hidden = true;
      }
    });
  }

  private getTogglePanelPairs(): Array<{ toggle: HTMLElement | null; panel: HTMLElement | null }> {
    return [
      { toggle: document.getElementById("history-toggle"), panel: document.getElementById("history-panel") },
      { toggle: document.getElementById("benchmark-toggle"), panel: document.getElementById("benchmark-panel") },
      { toggle: document.getElementById("export-toggle"), panel: document.getElementById("export-panel") },
      { toggle: document.getElementById("rules-toggle"), panel: document.getElementById("rules-panel") }
    ];
  }

  private closeAllPanels(): void {
    for (const { panel } of this.getTogglePanelPairs()) {
      if (panel !== null) {
        panel.hidden = true;
      }
    }
  }

  private mountKeyboardShortcuts(): void {
    for (const { toggle, panel } of this.getTogglePanelPairs()) {
      if (toggle !== null && panel !== null) {
        toggle.setAttribute("aria-expanded", "false");

        const observer = new MutationObserver(() => {
          toggle.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
        });
        observer.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
      }
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeAllPanels();
        return;
      }

      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "g") {
        event.preventDefault();
        const directionToggle = document.getElementById("direction-toggle") as HTMLButtonElement | null;

        if (directionToggle !== null) {
          this.handleDirectionToggle(directionToggle);
        }
      } else if (key === "m") {
        event.preventDefault();
        const modeToggle = document.getElementById("mode-toggle") as HTMLButtonElement | null;

        if (modeToggle !== null && !modeToggle.hidden) {
          this.handleModeToggle(modeToggle);
        }
      } else if (key === "c") {
        event.preventDefault();
        document.getElementById("copy-toggle")?.dispatchEvent(new MouseEvent("click"));
      } else if (key === "e") {
        event.preventDefault();
        document.getElementById("export-toggle")?.dispatchEvent(new MouseEvent("click"));
      } else if (key === "h") {
        event.preventDefault();
        document.getElementById("history-toggle")?.dispatchEvent(new MouseEvent("click"));
      } else if (key === "b") {
        event.preventDefault();
        document.getElementById("benchmark-toggle")?.dispatchEvent(new MouseEvent("click"));
      } else if (key === "r") {
        event.preventDefault();
        document.getElementById("rules-toggle")?.dispatchEvent(new MouseEvent("click"));
      } else if (key === "i") {
        event.preventDefault();
        document.getElementById("import-toggle")?.dispatchEvent(new MouseEvent("click"));
      }
    });
  }

  private mountHistoryPanel(): void {
    const toggleButton = document.getElementById("history-toggle") as HTMLButtonElement | null;
    const panel = document.getElementById("history-panel");

    if (toggleButton === null || panel === null) {
      return;
    }

    toggleButton.addEventListener("click", () => {
      panel.hidden = !panel.hidden;

      if (!panel.hidden) {
        this.renderHistory(panel);
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target as Node;

      if (!panel.hidden && !panel.contains(target) && target !== toggleButton) {
        panel.hidden = true;
      }
    });
  }

  private renderHistory(panel: HTMLElement): void {
    panel.innerHTML = "";

    const entries = this.historyStore.getAll();

    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "history-panel-empty";
      empty.textContent = "No conversion recorded yet in this session.";
      panel.appendChild(empty);
      return;
    }

    for (const entry of entries) {
      panel.appendChild(this.buildHistoryEntryElement(entry, panel));
    }
  }

  private buildHistoryEntryElement(entry: HistoryEntry, panel: HTMLElement): HTMLElement {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-entry";

    const meta = document.createElement("div");
    meta.className = "history-entry-meta";
    const time = new Date(entry.timestamp).toLocaleTimeString();
    meta.textContent = `${time} \u2014 ${directionLabels[entry.direction]} \u2014 ${entry.compressionRatio.toFixed(1)}%`;

    const preview = document.createElement("div");
    preview.className = "history-entry-preview";
    preview.textContent = entry.originalContent.replace(/\s+/g, " ").trim().slice(0, 80);

    item.appendChild(meta);
    item.appendChild(preview);

    item.addEventListener("click", () => {
      this.currentDirection = entry.direction;
      this.currentMode = entry.mode;

      const directionToggle = document.getElementById("direction-toggle") as HTMLButtonElement | null;

      if (directionToggle !== null) {
        directionToggle.textContent = directionLabels[this.currentDirection];
      }

      const modeToggle = document.getElementById("mode-toggle") as HTMLButtonElement | null;

      if (modeToggle !== null) {
        modeToggle.textContent = modeLabels[this.currentMode];
      }

      this.updateDirectionVisibility();
      this.originalPane?.setContent(entry.originalContent);
      panel.hidden = true;
    });

    return item;
  }

  private recordHistory(content: string, result: ConversionResult): void {
    if (content.trim().length === 0 || result.errorMessage !== null) {
      return;
    }

    this.historyStore.add({
      direction: result.direction,
      mode: result.mode,
      originalContent: content,
      convertedContent: result.code,
      compressionRatio: result.compressionRatio
    });
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

    window.clearTimeout(this.historyDebounceTimer);
    this.historyDebounceTimer = window.setTimeout(() => {
      this.recordHistory(content, result);
    }, 800);
  }

  private renderConverted(content: string): ConversionResult {
    const result = this.conversionEngine.convert(content, this.currentMode, this.rules, this.currentDirection);
    this.convertedPane?.setContent(result.code);
    this.backgroundScene?.pulse();
    return result;
  }

  public dispose(): void {
    this.originalPane?.destroy();
    this.convertedPane?.destroy();
    this.backgroundScene?.dispose();
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

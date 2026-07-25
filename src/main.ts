import { BackgroundScene } from "./ui/BackgroundScene";
import { EditorPane } from "./ui/EditorPane";
import { ConversionEngine, ConversionMode } from "./core/ConversionEngine";
import { detectLanguage } from "./core/LanguageDetector";
import { parseSource } from "./core/Parser";

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

class Application {
  private readonly conversionEngine: ConversionEngine;
  private originalPane: EditorPane | null;
  private convertedPane: EditorPane | null;
  private isSyncing: boolean;
  private currentMode: ConversionMode;

  constructor() {
    this.conversionEngine = new ConversionEngine();
    this.originalPane = null;
    this.convertedPane = null;
    this.isSyncing = false;
    this.currentMode = ConversionMode.Minified;
  }

  public mount(): void {
    this.mountBackground();
    this.mountEditors();
    this.mountModeToggle();
    this.refreshStatus(sampleSource);
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

    this.convertedPane = new EditorPane({
      parent: convertedMount,
      initialContent: this.conversionEngine.convert(sampleSource, this.currentMode).code,
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

  private handleModeToggle(toggleButton: HTMLButtonElement): void {
    this.currentMode =
      this.currentMode === ConversionMode.Minified ? ConversionMode.Justified : ConversionMode.Minified;

    toggleButton.textContent = modeLabels[this.currentMode];
    this.renderConverted(this.originalPane?.getContent() ?? sampleSource);
  }

  private handleOriginalChange(content: string): void {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.renderConverted(content);
    this.refreshStatus(content);
    this.isSyncing = false;
  }

  private renderConverted(content: string): void {
    if (this.convertedPane === null) {
      return;
    }

    const result = this.conversionEngine.convert(content, this.currentMode);
    this.convertedPane.setContent(result.code);
  }

  public dispose(): void {
    this.originalPane?.destroy();
    this.convertedPane?.destroy();
  }

  private refreshStatus(content: string): void {
    const language = detectLanguage(content);
    const parseResult = parseSource(content);

    const languageBadge = document.getElementById("language-badge");
    const tokenBadge = document.getElementById("token-badge");
    const lengthBadge = document.getElementById("length-badge");

    if (languageBadge !== null) {
      languageBadge.textContent = `Language: ${language}`;
    }

    if (tokenBadge !== null) {
      const suffix = parseResult.errorMessage !== null ? " (parse error)" : "";
      tokenBadge.textContent = `Tokens: ${parseResult.tokenCount}${suffix}`;
    }

    if (lengthBadge !== null) {
      lengthBadge.textContent = `Characters: ${content.length}`;
    }
  }
}

function bootstrap(): void {
  const app = new Application();
  app.mount();
}

document.addEventListener("DOMContentLoaded", bootstrap);

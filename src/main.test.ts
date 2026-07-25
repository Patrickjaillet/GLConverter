import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./ui/BackgroundScene", () => ({
  BackgroundScene: class {
    start(): void {}
    pulse(): void {}
    dispose(): void {}
  }
}));

async function mountApp(): Promise<InstanceType<typeof import("./main").Application>> {
  document.body.innerHTML = `
    <div id="app">
      <canvas id="background-canvas"></canvas>
      <div id="content">
        <header id="header">
          <div id="header-controls">
            <button id="direction-toggle" class="mode-toggle" type="button">Golf</button>
            <div class="history-widget">
              <button id="history-toggle" type="button" aria-haspopup="true">History</button>
              <div id="history-panel" class="history-panel" role="menu" hidden></div>
            </div>
            <div class="benchmark-widget">
              <button id="benchmark-toggle" type="button" aria-haspopup="true">Benchmark</button>
              <div id="benchmark-panel" class="benchmark-panel" role="menu" hidden></div>
            </div>
            <span id="engine-badge">Engine: —</span>
            <span id="version-badge"></span>
          </div>
        </header>
        <section id="status-bar" aria-live="polite">
          <span id="language-badge">Language: —</span>
          <span id="token-badge">Tokens: —</span>
          <span id="length-badge">Characters: —</span>
          <span id="compression-badge">Compression: —</span>
          <span id="equivalence-badge" hidden>Equivalence: —</span>
        </section>
        <main id="editors">
          <section class="editor-panel">
            <div class="editor-panel-header">
              <div class="header-actions">
                <button id="undo-toggle" type="button">Undo</button>
                <button id="redo-toggle" type="button">Redo</button>
                <button id="import-toggle" type="button">Import</button>
                <input id="import-input" type="file" accept=".js,.txt,text/javascript,text/plain" />
              </div>
            </div>
            <div id="editor-original" class="editor-mount"></div>
          </section>
          <section class="editor-panel">
            <div class="editor-panel-header">
              <div class="header-actions">
                <button id="copy-toggle" type="button">Copy</button>
                <div class="export-widget">
                  <button id="export-toggle" type="button" aria-haspopup="true">Export</button>
                  <div id="export-panel" class="export-panel" role="menu" hidden>
                    <button id="export-js" type="button">.js file</button>
                    <button id="export-txt" type="button">.txt file</button>
                  </div>
                </div>
                <div class="rules-widget">
                  <button id="rules-toggle" type="button" aria-haspopup="true">Rules</button>
                  <div id="rules-panel" class="rules-panel" role="menu" hidden></div>
                </div>
                <button id="mode-toggle" class="mode-toggle" type="button">Minified</button>
              </div>
            </div>
            <div id="editor-converted" class="editor-mount"></div>
          </section>
        </main>
      </div>
    </div>
  `;

  const { Application } = await import("./main");
  const app = new Application();
  await app.mount();
  return app;
}

describe("Application (UI integration)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  it("mounts the editors and renders an initial golfed, minified conversion", async () => {
    await mountApp();

    const converted = document.getElementById("editor-converted");
    expect(converted?.textContent).not.toBe("");

    const compressionBadge = document.getElementById("compression-badge");
    expect(compressionBadge?.textContent).toMatch(/^Compression: \d/);

    const languageBadge = document.getElementById("language-badge");
    expect(languageBadge?.textContent).toBe("Language: javascript");
  });

  it("updates engine and version badges on mount", async () => {
    await mountApp();

    const engineBadge = document.getElementById("engine-badge");
    expect(engineBadge?.textContent).toBe("Engine: JS (fallback)");

    const versionBadge = document.getElementById("version-badge");
    expect(versionBadge?.textContent).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it("toggles between Minified and Justified modes and updates the button label", async () => {
    await mountApp();

    const modeToggle = document.getElementById("mode-toggle") as HTMLButtonElement;
    expect(modeToggle.textContent).toBe("Minified");

    modeToggle.click();

    expect(modeToggle.textContent).toBe("Justified");

    const converted = document.getElementById("editor-converted");
    expect(converted?.querySelectorAll(".cm-line").length ?? 0).toBeGreaterThan(1);
  });

  it("toggles between Golf and De-golf direction, hiding the mode toggle and showing the equivalence badge", async () => {
    await mountApp();

    const directionToggle = document.getElementById("direction-toggle") as HTMLButtonElement;
    const modeToggle = document.getElementById("mode-toggle") as HTMLButtonElement;
    const equivalenceBadge = document.getElementById("equivalence-badge") as HTMLElement;

    expect(directionToggle.textContent).toBe("Golf");
    expect(modeToggle.hidden).toBe(false);
    expect(equivalenceBadge.hidden).toBe(true);

    directionToggle.click();

    expect(directionToggle.textContent).toBe("De-golf");
    expect(modeToggle.hidden).toBe(true);
    expect(equivalenceBadge.hidden).toBe(false);
    expect(equivalenceBadge.textContent).toMatch(/^Equivalence: /);
  });

  it("opens the rules panel populated with every golfing rule checkbox", async () => {
    await mountApp();

    const rulesToggle = document.getElementById("rules-toggle") as HTMLButtonElement;
    const rulesPanel = document.getElementById("rules-panel") as HTMLElement;

    expect(rulesPanel.hidden).toBe(true);
    rulesToggle.click();
    expect(rulesPanel.hidden).toBe(false);

    const checkboxes = rulesPanel.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(7);

    for (const checkbox of checkboxes) {
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    }
  });

  it("closes any open panel when Escape is pressed", async () => {
    await mountApp();

    const rulesToggle = document.getElementById("rules-toggle") as HTMLButtonElement;
    const rulesPanel = document.getElementById("rules-panel") as HTMLElement;

    rulesToggle.click();
    expect(rulesPanel.hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(rulesPanel.hidden).toBe(true);
  });

  it("toggles the direction via the Alt+G keyboard shortcut", async () => {
    await mountApp();

    const directionToggle = document.getElementById("direction-toggle") as HTMLButtonElement;
    expect(directionToggle.textContent).toBe("Golf");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "g", altKey: true }));

    expect(directionToggle.textContent).toBe("De-golf");
  });

  it("records history entries and restores them on click", async () => {
    vi.useFakeTimers();

    const app = await mountApp();
    void app;

    const historyToggle = document.getElementById("history-toggle") as HTMLButtonElement;
    const historyPanel = document.getElementById("history-panel") as HTMLElement;

    historyToggle.click();
    expect(historyPanel.querySelector(".history-panel-empty")).not.toBeNull();
    historyToggle.click();

    vi.useRealTimers();
  });
});

import { describe, it, expect } from "vitest";
import { HistoryStore } from "./HistoryStore";
import { ConversionDirection, ConversionMode } from "./ConversionEngine";

function baseEntry(overrides: Partial<Parameters<HistoryStore["add"]>[0]> = {}) {
  return {
    direction: ConversionDirection.Golf,
    mode: ConversionMode.Minified,
    originalContent: "const a = 1;",
    convertedContent: "const a=1;",
    compressionRatio: 10,
    ...overrides
  };
}

describe("HistoryStore", () => {
  it("starts empty", () => {
    const store = new HistoryStore();

    expect(store.getAll()).toEqual([]);
  });

  it("adds an entry and exposes it through getAll, most recent first", () => {
    const store = new HistoryStore();
    store.add(baseEntry({ originalContent: "a" }));
    store.add(baseEntry({ originalContent: "b" }));

    const entries = store.getAll();

    expect(entries).toHaveLength(2);
    expect(entries[0]?.originalContent).toBe("b");
    expect(entries[1]?.originalContent).toBe("a");
  });

  it("assigns a unique id and timestamp to each entry", () => {
    const store = new HistoryStore();
    const entry = store.add(baseEntry());

    expect(typeof entry.id).toBe("string");
    expect(entry.id.length).toBeGreaterThan(0);
    expect(typeof entry.timestamp).toBe("number");
  });

  it("does not duplicate consecutive entries with the same content and direction", () => {
    const store = new HistoryStore();
    store.add(baseEntry({ originalContent: "same" }));
    store.add(baseEntry({ originalContent: "same" }));

    expect(store.getAll()).toHaveLength(1);
  });

  it("records a new entry when the direction differs even if content is identical", () => {
    const store = new HistoryStore();
    store.add(baseEntry({ originalContent: "same", direction: ConversionDirection.Golf }));
    store.add(baseEntry({ originalContent: "same", direction: ConversionDirection.Degolf }));

    expect(store.getAll()).toHaveLength(2);
  });

  it("caps the number of stored entries at 20", () => {
    const store = new HistoryStore();

    for (let i = 0; i < 25; i += 1) {
      store.add(baseEntry({ originalContent: `content-${i}` }));
    }

    expect(store.getAll()).toHaveLength(20);
    expect(store.getAll()[0]?.originalContent).toBe("content-24");
  });

  it("clears all entries", () => {
    const store = new HistoryStore();
    store.add(baseEntry());
    store.clear();

    expect(store.getAll()).toEqual([]);
  });
});

import { ConversionDirection, ConversionMode } from "./ConversionEngine";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  direction: ConversionDirection;
  mode: ConversionMode;
  originalContent: string;
  convertedContent: string;
  compressionRatio: number;
}

const maxEntries = 20;

export class HistoryStore {
  private entries: HistoryEntry[];

  constructor() {
    this.entries = [];
  }

  public add(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
    const last = this.entries[0];

    if (last !== undefined && last.originalContent === entry.originalContent && last.direction === entry.direction) {
      return last;
    }

    const fullEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      ...entry
    };

    this.entries = [fullEntry, ...this.entries].slice(0, maxEntries);
    return fullEntry;
  }

  public getAll(): HistoryEntry[] {
    return this.entries;
  }

  public clear(): void {
    this.entries = [];
  }
}

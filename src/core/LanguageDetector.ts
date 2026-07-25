export enum SourceLanguage {
  JavaScript = "javascript",
  Unknown = "unknown"
}

const javascriptSignatures: RegExp[] = [
  /\bfunction\b/,
  /\bconst\b|\blet\b|\bvar\b/,
  /=>/,
  /\bconsole\.log\b/,
  /;\s*$/m
];

export function detectLanguage(source: string): SourceLanguage {
  const trimmed = source.trim();

  if (trimmed.length === 0) {
    return SourceLanguage.Unknown;
  }

  const matchCount = javascriptSignatures.reduce((count, signature) => {
    return signature.test(trimmed) ? count + 1 : count;
  }, 0);

  return matchCount > 0 ? SourceLanguage.JavaScript : SourceLanguage.Unknown;
}

import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, undo, redo } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#18181b", fontWeight: "600" },
  { tag: tags.string, color: "#3f6212" },
  { tag: tags.number, color: "#1d4ed8" },
  { tag: tags.comment, color: "#a1a1aa", fontStyle: "italic" },
  { tag: tags.function(tags.variableName), color: "#7c2d12" },
  { tag: tags.definition(tags.variableName), color: "#18181b" },
  { tag: tags.operator, color: "#52525b" },
  { tag: tags.punctuation, color: "#71717a" }
]);

const whiteTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#18181b",
      height: "100%",
      fontSize: "13.5px"
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', monospace",
      caretColor: "#18181b",
      padding: "1rem 0"
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      color: "#a1a1aa",
      border: "none",
      borderRight: "1px solid #e4e4e7"
    },
    ".cm-activeLine": {
      backgroundColor: "#fafafa"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#fafafa"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-scroller": {
      overflow: "auto"
    }
  },
  { dark: false }
);

export interface EditorPaneOptions {
  parent: HTMLElement;
  initialContent: string;
  readOnly: boolean;
  onChange?: (content: string) => void;
}

export class EditorPane {
  private readonly view: EditorView;

  constructor(options: EditorPaneOptions) {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      javascript(),
      syntaxHighlighting(highlightStyle),
      whiteTheme,
      EditorView.editable.of(!options.readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && options.onChange) {
          options.onChange(update.state.doc.toString());
        }
      })
    ];

    this.view = new EditorView({
      state: EditorState.create({
        doc: options.initialContent,
        extensions
      }),
      parent: options.parent
    });
  }

  public getContent(): string {
    return this.view.state.doc.toString();
  }

  public setContent(content: string): void {
    if (this.view.state.doc.toString() === content) {
      return;
    }

    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content }
    });
  }

  public undo(): void {
    undo(this.view);
    this.view.focus();
  }

  public redo(): void {
    redo(this.view);
    this.view.focus();
  }

  public destroy(): void {
    this.view.destroy();
  }
}

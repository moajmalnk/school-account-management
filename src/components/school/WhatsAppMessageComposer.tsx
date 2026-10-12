import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type WhatsAppComposerField = { key: string; label: string };

const CHIP_CLASS =
  "mx-[3px] inline-flex items-center gap-1 rounded-md bg-[#CCFBF1] px-1.5 py-[1px] align-baseline text-[12px] font-semibold leading-none text-[#0F766E] dark:bg-teal-400/15 dark:text-teal-100";

export function WhatsAppMessageComposer({
  value,
  onChange,
  fields,
  placeholder = "Write the message…",
}: {
  value: string;
  onChange: (next: string) => void;
  fields: readonly WhatsAppComposerField[];
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const labels = useRef(fields);
  labels.current = fields;

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    if (serializeEditor(root) === value) return;
    fillEditor(root, value, labels.current);
  }, [value, fields]);

  const publish = () => {
    const root = editorRef.current;
    if (!root) return;
    onChange(serializeEditor(root));
  };

  const place = (key: string, label: string) => {
    const root = editorRef.current;
    if (!root) return;
    root.focus();
    const existing = root.querySelector(`[data-field="${cssEscape(key)}"]`);
    if (existing) {
      placeCaretAfter(existing);
      existing.scrollIntoView({ block: "nearest" });
      return;
    }
    const chip = createChip(key, label);
    const selection = window.getSelection();
    const inside =
      selection && selection.rangeCount > 0 && root.contains(selection.anchorNode);
    if (inside && selection) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(chip);
      const space = document.createTextNode(" ");
      chip.after(space);
      placeCaretAfter(space);
    } else {
      const current = serializeEditor(root);
      if (current && !/[\s\n]$/.test(current)) root.appendChild(document.createTextNode(" "));
      root.appendChild(chip);
      const space = document.createTextNode(" ");
      root.appendChild(space);
      placeCaretAfter(space);
    }
    publish();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {fields.map((item) => {
          const used = templateHasField(value, item.key);
          return (
            <button
              key={item.key}
              type="button"
              title={used ? "Already in the message" : "Add to the message"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => place(item.key, item.label)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                used
                  ? "border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E]"
                  : "border-[#E5E5E5] bg-white text-black/70 hover:border-[#0F766E]/40 hover:bg-[#F0FDFA] hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="relative mt-2">
        {value.trim() === "" ? (
          <span className="pointer-events-none absolute left-3 top-2.5 text-[13.5px] text-black/35 dark:text-zinc-500">
            {placeholder}
          </span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="WhatsApp message"
          contentEditable
          suppressContentEditableWarning
          onInput={publish}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain").replace(/\r\n/g, "\n");
            insertPlainText(text);
            publish();
          }}
          onMouseDown={(event) => {
            const target = event.target as HTMLElement;
            const remove = target.closest("[data-remove-field]");
            if (!remove) return;
            event.preventDefault();
            remove.parentElement?.remove();
            publish();
          }}
          className="max-h-[320px] min-h-[220px] overflow-y-auto rounded-xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-[13.5px] leading-6 text-black outline-none [scrollbar-width:none] focus:border-[#0F766E]/40 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 [&::-webkit-scrollbar]:hidden"
        />
      </div>
    </div>
  );
}

function templateHasField(template: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`).test(template);
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/"/g, '\\"');
}

function fieldLabel(key: string, fields: readonly WhatsAppComposerField[]): string {
  return (
    fields.find((field) => field.key === key)?.label ??
    key.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function createChip(key: string, label: string): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.dataset.field = key;
  chip.contentEditable = "false";
  chip.className = CHIP_CLASS;
  const name = document.createElement("span");
  name.textContent = label;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.tabIndex = -1;
  remove.dataset.removeField = "true";
  remove.className = "text-[13px] font-medium leading-none text-[#0F766E]/55 hover:text-[#0F766E]";
  remove.setAttribute("aria-label", `Remove ${label}`);
  remove.textContent = "×";
  chip.append(name, remove);
  return chip;
}

function fillEditor(root: HTMLElement, template: string, fields: readonly WhatsAppComposerField[]) {
  root.replaceChildren();
  const pattern = /\{\{\s*([\w.]+)\s*\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const appendText = (text: string) => {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) root.appendChild(document.createElement("br"));
      if (line) root.appendChild(document.createTextNode(line));
    });
  };
  while ((match = pattern.exec(template))) {
    appendText(template.slice(last, match.index));
    root.appendChild(createChip(match[1], fieldLabel(match[1], fields)));
    last = match.index + match[0].length;
  }
  appendText(template.slice(last));
}

function nodeToText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00a0/g, " ");
  }
  if (!(node instanceof HTMLElement)) return "";
  if (node.dataset.field) return `{{${node.dataset.field}}}`;
  if (node.tagName === "BR") return "\n";
  if (node.tagName === "DIV" || node.tagName === "P") {
    const inner = Array.from(node.childNodes).map(nodeToText).join("").replace(/^\n/, "");
    return `\n${inner}`;
  }
  return Array.from(node.childNodes).map(nodeToText).join("");
}

function serializeEditor(root: HTMLElement): string {
  const raw = Array.from(root.childNodes).map(nodeToText).join("");
  if (!raw.includes("{{") && raw.trim() === "") return "";
  return raw;
}

function placeCaretAfter(node: Node) {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertPlainText(text: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const lines = text.split("\n");
  const fragment = document.createDocumentFragment();
  lines.forEach((line, index) => {
    if (index > 0) fragment.appendChild(document.createElement("br"));
    if (line) fragment.appendChild(document.createTextNode(line));
  });
  const last = fragment.lastChild;
  range.insertNode(fragment);
  if (last) placeCaretAfter(last);
}

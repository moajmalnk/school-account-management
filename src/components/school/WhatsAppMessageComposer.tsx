import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type WhatsAppComposerField = { key: string; label: string };

const CHIP_CLASS =
  "inline-flex items-center gap-1 rounded-md bg-[#CCFBF1] px-1.5 py-[1px] align-baseline text-[12px] font-semibold leading-none text-[#0F766E] dark:bg-teal-400/15 dark:text-teal-100";

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

  /** Always insert at the caret — same detail can be used more than once. */
  const place = (key: string, label: string) => {
    const root = editorRef.current;
    if (!root) return;
    root.focus();
    const chip = createChip(key, label);
    const trailing = document.createTextNode(" ");
    const selection = window.getSelection();
    const inside =
      selection && selection.rangeCount > 0 && root.contains(selection.anchorNode);
    if (inside && selection) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const fragment = document.createDocumentFragment();
      if (needsSpaceBefore(range)) fragment.appendChild(document.createTextNode(" "));
      fragment.appendChild(chip);
      fragment.appendChild(trailing);
      range.insertNode(fragment);
      placeCaretAfter(trailing);
    } else {
      const current = serializeEditor(root);
      if (current && !/[\s\n]$/.test(current)) root.appendChild(document.createTextNode(" "));
      root.appendChild(chip);
      root.appendChild(trailing);
      placeCaretAfter(trailing);
    }
    chip.scrollIntoView({ block: "nearest" });
    publish();
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] text-black/45 dark:text-zinc-500">
        Tap a detail to insert it at the cursor. You can add the same one more than once.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {fields.map((item) => {
          const count = templateFieldCount(value, item.key);
          return (
            <button
              key={item.key}
              type="button"
              title={
                count > 0
                  ? `Insert ${item.label} again (${count} in message)`
                  : `Insert ${item.label}`
              }
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => place(item.key, item.label)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                count > 0
                  ? "border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E] hover:border-[#0F766E]/50 hover:bg-[#CCFBF1] dark:border-teal-500/40 dark:bg-teal-950/40 dark:text-teal-200"
                  : "border-[#E5E5E5] bg-white text-black/70 hover:border-[#0F766E]/40 hover:bg-[#F0FDFA] hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300",
              )}
            >
              <span>{item.label}</span>
              {count > 0 ? (
                <span className="rounded-full bg-[#0F766E]/12 px-1.5 py-px font-mono text-[10px] font-bold tabular-nums text-[#0F766E] dark:bg-teal-400/15 dark:text-teal-200">
                  {count}
                </span>
              ) : null}
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

function templateFieldCount(template: string, key: string): number {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = template.match(new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "g"));
  return matches?.length ?? 0;
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
  // Chips used to carry CSS margin that looked like a space — keep a real gap so
  // repeated details (e.g. receipt no.) do not render as RC-1023RC-1023.
  return raw.replace(/\}\}(\s*)\{\{/g, (_match, ws: string) => `}}${ws || " "}{{`);
}

function needsSpaceBefore(range: Range): boolean {
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    const before = text.slice(0, range.startOffset);
    if (!before) {
      const prev = node.previousSibling;
      return Boolean(prev && prev instanceof HTMLElement && prev.dataset.field);
    }
    return !/[\s\n]$/.test(before);
  }
  if (node instanceof HTMLElement) {
    const prev =
      range.startOffset > 0 ? node.childNodes[range.startOffset - 1] : node.previousSibling;
    if (prev instanceof HTMLElement && prev.dataset.field) return true;
    if (prev?.nodeType === Node.TEXT_NODE) {
      return !/[\s\n]$/.test(prev.textContent ?? "");
    }
  }
  return false;
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

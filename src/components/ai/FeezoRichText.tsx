import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Inline `**bold**`, `*italic*` / `_italic_` and `` `code` `` — rendered as React nodes, never HTML. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*|(?<![A-Za-z0-9])_[^_\s][^_\n]*_(?![A-Za-z0-9]))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-slate-900 dark:text-zinc-50">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[12px] dark:bg-white/10">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ol"; items: string[]; start: number }
  | { kind: "ul"; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const push = (b: Block) => blocks.push(b);
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const prev = blocks[blocks.length - 1];
    const ol = /^\s*(\d{1,2})[.)]\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const h = /^\s*#{1,4}\s+(.*)$/.exec(line);
    const q = /^\s*>\s?(.*)$/.exec(line);
    if (!line.trim()) {
      blocks.push({ kind: "p", lines: [] });
    } else if (ol) {
      if (prev?.kind === "ol") prev.items.push(ol[2] ?? "");
      else push({ kind: "ol", items: [ol[2] ?? ""], start: Number(ol[1]) || 1 });
    } else if (ul) {
      if (prev?.kind === "ul") prev.items.push(ul[1] ?? "");
      else push({ kind: "ul", items: [ul[1] ?? ""] });
    } else if (h) {
      push({ kind: "h", text: h[1] ?? "" });
    } else if (q) {
      push({ kind: "quote", text: q[1] ?? "" });
    } else if (prev?.kind === "p" && prev.lines.length) {
      prev.lines.push(line);
    } else {
      push({ kind: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => b.kind !== "p" || b.lines.length > 0);
}

export function FeezoRichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("space-y-2 break-words", className)}>
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        if (b.kind === "h") {
          return (
            <p key={k} className="font-semibold text-slate-900 dark:text-zinc-50">
              {renderInline(b.text, k)}
            </p>
          );
        }
        if (b.kind === "quote") {
          return (
            <p
              key={k}
              className="rounded-lg border-l-2 border-amber-400 bg-amber-50/80 px-2.5 py-1.5 text-[12.5px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
            >
              {renderInline(b.text, k)}
            </p>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={k} start={b.start} className="space-y-1.5">
              {b.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[10.5px] font-bold text-[#0F766E] dark:bg-teal-400/15 dark:text-teal-300">
                    {b.start + ii}
                  </span>
                  <span className="min-w-0 flex-1">{renderInline(item, `${k}-${ii}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={k} className="space-y-1">
              {b.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F766E]/60 dark:bg-teal-400/60" />
                  <span className="min-w-0 flex-1">{renderInline(item, `${k}-${ii}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={k}>
            {b.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line, `${k}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

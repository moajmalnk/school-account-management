import { lazy, Suspense, useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

type HelpFlowchartProps = {
  title: string;
  mermaid: string;
  className?: string;
};

/** Turn Open_Ledger_Setup → “Open Ledger Setup” inside Mermaid node / edge labels. */
function humanizeMermaidLabels(source: string): string {
  const space = (raw: string) =>
    raw
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  return source
    .replace(/\[([^\]]+)\]/g, (_, label: string) => `[${space(label)}]`)
    .replace(/\{([^}]+)\}/g, (_, label: string) => `{${space(label)}}`)
    .replace(/\|([^|\n]+)\|/g, (_, label: string) => `|${space(label)}|`);
}

function usePrefersDark(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

function FlowchartInner({ title, mermaid: source, className }: HelpFlowchartProps) {
  const reactId = useId().replace(/:/g, "");
  const dark = usePrefersDark();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const diagram = humanizeMermaidLabels(source.trim());

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily:
            '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
          flowchart: {
            curve: "basis",
            htmlLabels: false,
            padding: 18,
            nodeSpacing: 36,
            rankSpacing: 42,
            diagramPadding: 8,
            useMaxWidth: true,
          },
          themeVariables: dark
            ? {
                background: "transparent",
                primaryColor: "#134E4A",
                primaryTextColor: "#ECFDF5",
                primaryBorderColor: "#2DD4BF",
                secondaryColor: "#1E293B",
                tertiaryColor: "#0F172A",
                lineColor: "#5EEAD4",
                textColor: "#E2E8F0",
                mainBkg: "#134E4A",
                nodeBorder: "#2DD4BF",
                clusterBkg: "#0F172A",
                titleColor: "#5EEAD4",
                edgeLabelBackground: "#0F172A",
                fontSize: "13px",
              }
            : {
                background: "transparent",
                primaryColor: "#F0FDFA",
                primaryTextColor: "#0F766E",
                primaryBorderColor: "#99F6E4",
                secondaryColor: "#FFFFFF",
                tertiaryColor: "#F8FAFC",
                lineColor: "#14B8A6",
                textColor: "#0F172A",
                mainBkg: "#F0FDFA",
                nodeBorder: "#5EEAD4",
                clusterBkg: "#FFFFFF",
                titleColor: "#0F766E",
                edgeLabelBackground: "#FFFFFF",
                fontSize: "13px",
              },
        });

        const { svg: rendered } = await mermaid.render(`help-flow-${reactId}`, diagram);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dark, reactId, source]);

  if (failed) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[12.5px] text-slate-500 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400",
          className,
        )}
        role="note"
      >
        Flowchart unavailable. Follow the numbered steps below.
      </div>
    );
  }

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E7EEF0] bg-gradient-to-b from-[#F7FBFA] to-white shadow-[0_1px_0_rgba(15,118,110,0.04)] dark:border-white/10 dark:from-zinc-950 dark:to-zinc-950/80 dark:shadow-none",
        className,
      )}
      aria-label={title}
    >
      <figcaption className="flex items-center gap-2 border-b border-[#EAF2F1] px-4 py-2.5 dark:border-white/10">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF]"
          aria-hidden
        />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-[#0F766E] uppercase dark:text-[#5EEAD4]">
          {title}
        </span>
      </figcaption>
      <div className="relative mobile-scrollbar-none overflow-x-auto px-3 py-5 sm:px-5 [scrollbar-width:thin]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,118,110,0.12) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden
        />
        {svg ? (
          <div
            className={cn(
              "relative mx-auto min-w-[260px] max-w-full",
              "[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full",
              "[&_.node rect]:!rx-[12px] [&_.node rect]:!ry-[12px]",
              "[&_.node .label]:!font-medium",
              "[&_.edgeLabel]:!rounded-md [&_.edgeLabel]:!px-1",
            )}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="relative flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#CCFBF1]/70 dark:bg-teal-900/40" />
          </div>
        )}
      </div>
    </figure>
  );
}

/** Lazy so mermaid is only loaded when a guide with a flowchart opens. */
const LazyFlowchart = lazy(async () => ({
  default: FlowchartInner,
}));

export function HelpFlowchart(props: HelpFlowchartProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-36 items-center justify-center rounded-2xl border border-[#E7EEF0] bg-[#F7FBFA] dark:border-white/10 dark:bg-zinc-950">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#CCFBF1]/70 dark:bg-teal-900/40" />
        </div>
      }
    >
      <LazyFlowchart {...props} />
    </Suspense>
  );
}

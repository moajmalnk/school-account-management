import { lazy, Suspense, useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

type HelpFlowchartProps = {
  title: string;
  mermaid: string;
  className?: string;
};

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
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "neutral",
          flowchart: { curve: "basis", htmlLabels: false, padding: 12 },
          themeVariables: dark
            ? {
                primaryColor: "#134E4A",
                primaryTextColor: "#F0FDFA",
                primaryBorderColor: "#2DD4BF",
                lineColor: "#5EEAD4",
                secondaryColor: "#1E293B",
                tertiaryColor: "#0F172A",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              }
            : {
                primaryColor: "#CCFBF1",
                primaryTextColor: "#134E4A",
                primaryBorderColor: "#0F766E",
                lineColor: "#0F766E",
                secondaryColor: "#F8FAFC",
                tertiaryColor: "#FFFFFF",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              },
        });
        const { svg: rendered } = await mermaid.render(`help-flow-${reactId}`, source.trim());
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
          "rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400",
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
        "overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-zinc-950/60",
        className,
      )}
      aria-label={title}
    >
      <figcaption className="border-b border-slate-100 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#0F766E] dark:border-white/10 dark:text-[#2DD4BF]">
        {title}
      </figcaption>
      <div className="mobile-scrollbar-none overflow-x-auto p-3 [scrollbar-width:thin]">
        {svg ? (
          <div
            className="mx-auto min-w-[280px] max-w-full [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-28 items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
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
        <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-zinc-900">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      }
    >
      <LazyFlowchart {...props} />
    </Suspense>
  );
}

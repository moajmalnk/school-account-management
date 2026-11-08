/** Lightweight route pending UI — safe for the marketing critical path. */

export function WorkspacePending({
  label = "Opening workspace…",
  detail,
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          {label}
        </div>
        {detail ? <p className="mt-2 text-sm text-black/50">{detail}</p> : null}
      </div>
    </div>
  );
}

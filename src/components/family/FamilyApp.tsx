import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { FamilyFrame, FamilyNav } from "@/components/family/FamilyChrome";
import { FamilyProvider, useFamily } from "@/lib/family-session";

export function FamilyApp() {
  return (
    <FamilyProvider>
      <FamilyGate />
    </FamilyProvider>
  );
}

function FamilyGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { ready, signedIn, previewName, previewEnded, endPreview } = useFamily();
  const bare = pathname.startsWith("/family/login") || pathname.startsWith("/family/join");

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const previous = link?.getAttribute("href") ?? "/manifest.webmanifest";
    link?.setAttribute("href", "/family.webmanifest");
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      link?.setAttribute("href", previous);
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    if (!ready || bare) return;
    if (!signedIn) navigate({ href: "/family/login", replace: true });
  }, [ready, signedIn, bare, navigate]);

  if (bare) return <Outlet />;
  if (previewEnded) {
    return (
      <FamilyFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold">Preview ended</p>
          <p className="mt-2 text-sm text-slate-500">You can close this tab. Your school login is still open.</p>
        </div>
      </FamilyFrame>
    );
  }
  if (!ready || !signedIn) {
    return (
      <FamilyFrame>
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Opening family app…</div>
      </FamilyFrame>
    );
  }
  return (
    <FamilyFrame>
      <div className="flex h-dvh flex-col overflow-hidden">
        {previewName ? (
          <div className="flex items-center justify-between gap-3 bg-[#0F766E] px-4 py-2 text-sm text-white">
            <p className="min-w-0 truncate">Viewing the family app as {previewName}</p>
            <button
              type="button"
              onClick={() => void endPreview()}
              className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              Exit preview
            </button>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </div>
        <FamilyNav />
      </div>
    </FamilyFrame>
  );
}

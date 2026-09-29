import {
  sessionCanAccessFinanceView,
  sessionCanAccessSettings,
  sessionCanAccessSettingsTab,
  sessionHasAnyFinance,
  sessionHasPermission,
  type Session,
} from "@/lib/auth";
import type { HelpAccess } from "@/lib/help/guides";

export function canUseHelpAccess(
  session: Session | null | undefined,
  access: HelpAccess | undefined,
): boolean {
  if (!access) return true;
  if (!session) return false;
  switch (access.kind) {
    case "permission":
      return sessionHasPermission(session, access.key);
    case "finance":
      return access.view
        ? sessionCanAccessFinanceView(session, access.view)
        : sessionHasAnyFinance(session);
    case "settings":
      return access.tab
        ? sessionCanAccessSettingsTab(session, access.tab)
        : sessionCanAccessSettings(session);
  }
}

/** Split an in-app href like `/tenant/finance?tab=receive` for `navigate({ to, search })`. */
export function parseHelpHref(href: string): { to: string; search?: Record<string, string> } {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  const search = Object.fromEntries(params.entries());
  return { to: path, search: Object.keys(search).length ? search : undefined };
}

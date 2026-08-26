import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { syncClientStateToCurrentBuild } from "@/lib/app-version";
import { router } from "@/router";
import { applyWorkspaceThemeMode, peekStoredThemeMode } from "@/lib/tenant-store";

import "./styles.css";

syncClientStateToCurrentBuild();
applyWorkspaceThemeMode(peekStoredThemeMode());

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "@/router";
import { applyWorkspaceThemeMode, peekStoredThemeMode } from "@/lib/tenant-store";

import "./styles.css";

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

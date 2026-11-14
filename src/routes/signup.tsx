import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { applyDocumentSeo, PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

export const Route = createFileRoute("/signup")({
  component: SignupLayout,
});

function SignupLayout() {
  useEffect(() => {
    applyDocumentSeo(PUBLIC_PAGE_SEO.signup);
  }, []);

  return <Outlet />;
}

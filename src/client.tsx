import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  const app = <StrictMode><StartClient /></StrictMode>;
  if (import.meta.env.VITE_GITHUB_PAGES === "1") {
    createRoot(document).render(app);
  } else {
    hydrateRoot(document, app);
  }
});

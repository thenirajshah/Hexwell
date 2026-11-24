import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useEffect } from "react";
import { Mark } from "@/components/mark";
import { hydrateBench, useBench } from "@/lib/bench";

export function Shell({ children }: { children: React.ReactNode }) {
  const saved = useBench((state) => state.items.length);

  useEffect(() => {
    void hydrateBench();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" search={{ q: "", std: "", kind: "", pid: "", nom: "" }} className="flex min-w-0 items-center gap-2 text-foreground">
            <Mark />
            <span className="truncate font-display text-lg font-medium tracking-tight">Hexwell</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              search={{ q: "", std: "", kind: "", pid: "", nom: "" }}
              className="motion-colors inline-flex h-11 items-center rounded-lg px-3 hover:bg-muted"
              activeOptions={{ exact: true, includeSearch: false }}
              activeProps={{ className: "bg-muted" }}
            >
              Catalog
            </Link>
            <Link
              to="/bench"
              className="motion-colors inline-flex h-11 items-center gap-2 rounded-lg px-3 hover:bg-muted"
              activeProps={{ className: "bg-muted" }}
            >
              <Bookmark className="size-4" aria-hidden="true" />
              Bench
              <span className="min-w-4 rounded-md bg-accent px-1.5 text-center text-xs tabular-nums text-accent-foreground">{saved}</span>
            </Link>
          </nav>
        </div>
      </header>
      <div id="content">{children}</div>
      <footer className="mx-auto mt-4 max-w-6xl border-t border-border px-4 py-8 text-sm text-muted-foreground">
        <p className="font-display text-base text-foreground">Hexwell</p>
        <p className="mt-1 max-w-xl">
          Nominal dimensions from published ISO, DIN, JIS, and ASTM/ANSI tables. Confirm the current standard before you cut metal.
        </p>
      </footer>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { hydrateBench, useBench } from "@/lib/bench";
import { getPart } from "@/lib/fasteners";

export const Route = createFileRoute("/bench")({
  component: BenchPage,
});

function BenchPage() {
  const [ready, setReady] = useState(false);
  const items = useBench((state) => state.items);
  const remove = useBench((state) => state.remove);

  useEffect(() => {
    void hydrateBench().then(() => setReady(true));
  }, []);

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">Bench</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">Sizes you set aside on this device. They stay in the browser, not in an account.</p>
        {!ready ? (
          <div className="mt-6 h-24 rounded-3xl bg-muted motion-safe:animate-pulse" />
        ) : items.length === 0 ? (
          <div className="panel mt-6 p-6">
            <h2 className="font-display text-lg font-medium">Nothing saved yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Open a fastener and save the size you are about to use.</p>
            <Link
              to="/"
              search={{ q: "", std: "", kind: "", pid: "", nom: "" }}
              className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Browse the catalog
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {items.map((item, index) => {
              const part = getPart(item.id);
              if (!part) return null;
              return (
                <li key={`${item.id}-${item.size ?? "all"}`} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-primary">
                        {part.group} · {part.code}
                      </p>
                      <Link
                        to="/part/$partId"
                        params={{ partId: part.id }}
                        search={{ size: item.size ?? "" }}
                        className="mt-1 block font-medium hover:underline"
                      >
                        {part.name}
                      </Link>
                      <p className="text-sm tabular-nums text-muted-foreground">{item.size ?? "Any size"}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => remove(item.id, item.size)}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </Shell>
  );
}

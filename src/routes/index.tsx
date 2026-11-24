import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { SearchSelect } from "@/components/search-select";
import { hydrateBench, useBench } from "@/lib/bench";
import { cn } from "@/lib/cn";
import { publicUrl } from "@/lib/public-url";
import {
  countParts,
  getPart,
  GROUPS,
  KINDS,
  matchingSize,
  nominalOf,
  parts,
  rowCount,
  searchParts,
  sortSizes,
  type Kind,
} from "@/lib/fasteners";

type HomeSearch = { q: string; std: string; kind: string; pid: string; nom: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    q: typeof search.q === "string" ? search.q : "",
    std: typeof search.std === "string" ? search.std : "",
    kind: typeof search.kind === "string" ? search.kind : "",
    pid: typeof search.pid === "string" ? search.pid : "",
    nom: typeof search.nom === "string" ? search.nom : "",
  }),
  component: Home,
});

const SAMPLES = ["M8", "M10", "1/4-20", "DIN 933", "ISO 4762", "clevis"];

function Home() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [draft, setDraft] = useState(search.q);
  const [ready, setReady] = useState(false);
  const recent = useBench((state) => state.recent);
  const savedAny = useBench((state) => state.savedAny);

  useEffect(() => {
    setDraft(search.q);
  }, [search.q]);

  useEffect(() => {
    if (draft === search.q) return;
    const handle = window.setTimeout(() => {
      void navigate({
        search: { q: draft, std: search.std, kind: search.kind, pid: search.pid, nom: search.nom },
        replace: true,
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [draft, navigate, search.kind, search.nom, search.pid, search.q, search.std]);

  useEffect(() => {
    void hydrateBench().then(() => setReady(true));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") {
        event.preventDefault();
        document.getElementById("fastener-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(
    () => searchParts(search.q, search.std, search.kind, search.nom, search.pid),
    [search.kind, search.nom, search.pid, search.q, search.std],
  );
  const optionParts = useMemo(
    () => parts.filter((part) => (!search.std || part.group === search.std) && (!search.kind || part.kind === search.kind)),
    [search.kind, search.std],
  );
  const chosen = search.pid ? getPart(search.pid) : null;
  const sizeOptions = useMemo(() => {
    if (chosen) return sortSizes(chosen.sizes);
    const tokens = new Set<string>();
    for (const part of optionParts) {
      for (const size of part.sizes) tokens.add(nominalOf(size));
    }
    return [...tokens].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [chosen, optionParts]);

  const filtering = Boolean(search.q || search.std || search.kind || search.pid || search.nom);

  function setFilter(next: Partial<HomeSearch>) {
    const merged: HomeSearch = {
      q: search.q,
      std: search.std,
      kind: search.kind,
      pid: search.pid,
      nom: search.nom,
      ...next,
    };
    const picked = merged.pid ? getPart(merged.pid) : null;
    if (picked && ((merged.std && picked.group !== merged.std) || (merged.kind && picked.kind !== merged.kind))) {
      merged.pid = "";
    }
    const still = merged.pid ? getPart(merged.pid) : null;
    if (merged.nom && still && !still.sizes.some((size) => size === merged.nom || nominalOf(size) === merged.nom)) {
      merged.nom = "";
    }
    void navigate({ search: merged, replace: true });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 pb-8">
        <section className="panel mt-6 p-4 sm:p-6">
          {filtering ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary">Catalog</p>
                <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
                  {search.q.trim() ? `Results for “${search.q.trim()}”` : "Filtered standards"}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  setFilter({ q: "", std: "", kind: "", pid: "", nom: "" });
                }}
                className="motion-colors inline-flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-muted"
              >
                <X className="size-4" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          ) : (
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-widest text-primary">ENGINEERING DIMENSION REFERENCE</p>
              <h1 className="mt-2 font-display text-4xl font-medium leading-tight tracking-tight">
                Fastener Dimension Catalogue
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                {partsLabel()} across ISO, DIN, JIS, and ASTM. Pick a thread, see the wrench size, and copy the callout.
              </p>
            </div>
          )}
          <label className="mt-6 block">
            <span className="sr-only">Search fasteners</span>
            <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id="fastener-search"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search M8, 1/4-20, DIN 933…"
                className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              {draft ? (
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setDraft("")}
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-border px-2 py-1 text-xs text-muted-foreground sm:inline">/</kbd>
              )}
            </span>
          </label>
          {!filtering ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setDraft(sample)}
                  className="motion-colors h-11 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
                >
                  {sample}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-5 border-t border-border pt-4">
            <h2 className="text-sm font-semibold tracking-wide text-spec-heading uppercase">01 / Select parameters</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SearchSelect
                label="Standard"
                value={search.std}
                placeholder="Any standard"
                searchPlaceholder="Search standards"
                options={[{ value: "", label: "Any standard" }, ...GROUPS.map((group) => ({ value: group.id, label: group.label }))]}
                onChange={(value) => setFilter({ std: value })}
              />
              <SearchSelect
                label="Type"
                value={search.kind}
                placeholder="Any type"
                searchPlaceholder="Search types"
                options={[{ value: "", label: "Any type" }, ...KINDS.map((kind) => ({ value: kind.id, label: kind.label }))]}
                onChange={(value) => setFilter({ kind: value })}
              />
              <SearchSelect
                label="Fastener"
                value={search.pid}
                placeholder="Any fastener"
                searchPlaceholder="Search fasteners"
                empty="No fastener matches that"
                options={[
                  { value: "", label: "Any fastener" },
                  ...optionParts.map((part) => ({ value: part.id, label: `${part.group} ${part.code} · ${part.name}` })),
                ]}
                onChange={(value) => setFilter({ pid: value })}
              />
              <SearchSelect
                label="Size"
                value={search.nom}
                placeholder={chosen ? "Any size" : "Any nominal size"}
                searchPlaceholder="Search sizes"
                empty="No size matches that"
                options={[
                  { value: "", label: chosen ? "Any size" : "Any nominal size" },
                  ...sizeOptions.map((size) => ({ value: size, label: size.replace(/x(?=\d)/gi, " × ") })),
                ]}
                onChange={(value) => setFilter({ nom: value })}
              />
            </div>
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GROUPS.map((group) => {
              const on = search.std === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter({ std: on ? "" : group.id })}
                  className={cn(
                    "motion-colors rounded-3xl border px-4 py-3 text-left",
                    on ? "border-primary bg-accent" : "panel hover:bg-muted",
                  )}
                >
                  <span className="block font-display text-lg font-medium">{group.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{group.blurb}</span>
                  <span className="mt-2 block text-sm tabular-nums text-foreground">{countParts(group.id)} families</span>
                </button>
              );
            })}
          </div>
          <div className="flex w-full min-w-0 flex-wrap gap-2 pb-1">
            <FilterChip on={!search.kind} onClick={() => setFilter({ kind: "" })} label="All" />
            {KINDS.map((kind) => (
              <FilterChip
                key={kind.id}
                on={search.kind === kind.id}
                onClick={() => setFilter({ kind: search.kind === kind.id ? "" : kind.id })}
                label={`${kind.label} · ${countParts(search.std || undefined, kind.id)}`}
              />
            ))}
          </div>
        </section>

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          <span className="tabular-nums text-foreground">{results.length}</span> {results.length === 1 ? "family" : "families"}
          {search.q ? ` for “${search.q.trim()}”` : ""}
        </p>

        {results.length === 0 ? (
          <div className="panel mt-4 p-6">
            <h2 className="font-display text-lg font-medium">Nothing matches that</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try M8, 1/4-20, ISO 4014, or a plain word like washer.</p>
            <button
              type="button"
              className="mt-4 h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => {
                setDraft("");
                setFilter({ q: "" });
              }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((part) => (
              <li key={part.id} className="min-w-0">
                <Link
                  to="/part/$partId"
                  params={{ partId: part.id }}
                  search={{ size: matchingSize(part.sizes, search.nom) }}
                  className="panel group flex h-full min-w-0 flex-col overflow-hidden p-4 motion-colors hover:border-primary"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white" aria-hidden="true">
                      <img src={publicUrl(`fastener/${part.photo}.png`)} alt="" width={56} height={56} loading="lazy" decoding="async" className="size-14 object-contain" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">
                        {part.group}
                        <span className="text-muted-foreground"> · {kindLabel(part.kind)}</span>
                        {ready && savedAny(part.id) ? (
                          <Bookmark className="ml-1 inline size-3.5 fill-current" aria-label="On your bench" />
                        ) : null}
                      </p>
                      <h2 className="mt-1 font-semibold leading-snug">{part.name}</h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{part.code}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="tabular-nums text-foreground">{part.count}</span> callouts · {part.unit === "in" ? "inch" : "metric"}
                    </p>
                    <p className="mt-1 truncate text-sm tabular-nums">{sortPreview(part.sizes)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {ready && recent.length > 0 && !filtering ? (
          <section className="mt-10">
            <h2 className="font-display text-lg font-medium">Recently opened</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {recent.map((item) => {
                const part = getPart(item.id);
                if (!part) return null;
                return (
                  <li key={item.id}>
                    <Link
                      to="/part/$partId"
                      params={{ partId: part.id }}
                      search={{ size: "" }}
                      className="panel flex h-12 items-center justify-between gap-3 px-3 text-sm hover:bg-muted"
                    >
                      <span className="min-w-0 truncate">
                        {part.name}
                        <span className="text-muted-foreground"> · {part.code}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{part.group}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function FilterChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "motion-colors h-11 shrink-0 rounded-lg border px-3 text-sm",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function kindLabel(kind: Kind): string {
  if (kind === "BOLT") return "Bolt";
  if (kind === "NUT") return "Nut";
  if (kind === "WASHER") return "Washer";
  return "Pin";
}

function sortPreview(sizes: string[]): string {
  return sortSizes(sizes).slice(0, 5).join(" · ");
}

function partsLabel(): string {
  return `${countParts()} families, ${rowCount.toLocaleString("en-US")} sizes`;
}

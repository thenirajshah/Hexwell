import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { SearchSelect } from "@/components/search-select";
import { Button } from "@/components/ui/button";
import { hydrateBench, useBench } from "@/lib/bench";
import { cn } from "@/lib/cn";
import {
  cell,
  findMates,
  getPart,
  loadGroup,
  orderColumns,
  rowsForSize,
  preferredSize,
  sortSizes,
  splitFields,
  type Cell,
  type PartMeta,
  type TableData,
} from "@/lib/fasteners";
import { publicUrl } from "@/lib/public-url";
import { calloutKey, copyBlock, formatCell, labelFor, plainSentence, readingHint, resolvedUnit } from "@/lib/format";

type PartSearch = { size: string };

export const Route = createFileRoute("/part/$partId")({
  validateSearch: (search: Record<string, unknown>): PartSearch => ({
    size: typeof search.size === "string" ? search.size : "",
  }),
  loader: async ({ params }) => {
    const meta = getPart(params.partId);
    if (!meta) throw notFound();
    const group = await loadGroup(meta.group);
    const table = group[meta.table];
    if (!table) throw notFound();
    return table;
  },
  head: ({ params }) => {
    const meta = getPart(params.partId);
    return {
      meta: [{ title: meta ? `${meta.name} · Hexwell` : "Hexwell" }],
    };
  },
  pendingComponent: PartPending,
  notFoundComponent: PartMissing,
  component: PartPage,
});

function PartPage() {
  const meta = getPart(Route.useParams().partId);
  const table = Route.useLoaderData();
  if (!meta) return <PartMissing />;
  return <PartBody meta={meta} table={table} />;
}

function PartBody({ meta, table }: { meta: PartMeta; table: TableData }) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/part/$partId" });
  const sizes = useMemo(() => sortSizes(meta.sizes), [meta.sizes]);
  const initial = preferredSize(sizes, search.size);
  const [size, setSize] = useState(initial);
  const [rowIndex, setRowIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const display = useBench((state) => state.display);
  const setDisplay = useBench((state) => state.setDisplay);
  const saved = useBench((state) => state.saved(meta.id, size || null));
  const toggle = useBench((state) => state.toggle);

  const heldLength = useRef<string | null>(null);
  const seenPart = useRef(meta.id);

  useEffect(() => {
    void hydrateBench().then(() => useBench.getState().touch(meta.id));
  }, [meta.id]);

  useEffect(() => {
    if (seenPart.current !== meta.id) {
      seenPart.current = meta.id;
      heldLength.current = null;
    }
    setSize(initial);
    const rows = rowsOf(table, meta, initial);
    const index = meta.lengthKey ? table.columns.indexOf(meta.lengthKey) : -1;
    if (index < 0 || rows.length === 0) {
      setRowIndex(0);
      return;
    }
    const unique = new Set(rows.map((row) => String(row[index] ?? "")).filter(Boolean));
    const wanted = heldLength.current;
    if (wanted == null || unique.size <= 1) {
      setRowIndex(0);
      heldLength.current = String(rows[0]?.[index] ?? "");
      return;
    }
    const found = wanted ? rows.findIndex((row) => String(row[index] ?? "") === wanted) : -1;
    setRowIndex(found);
    if (found < 0) heldLength.current = "";
  }, [initial, meta, table]);

  const groupRows = useMemo(() => rowsOf(table, meta, size), [meta, size, table]);
  const lengthIndex = meta.lengthKey ? table.columns.indexOf(meta.lengthKey) : -1;
  const lengths = useMemo(() => {
    if (lengthIndex < 0) return [] as string[];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const row of groupRows) {
      const text = String(row[lengthIndex] ?? "");
      if (!text || seen.has(text)) continue;
      seen.add(text);
      list.push(text);
    }
    return list;
  }, [groupRows, lengthIndex]);

  const needsLength = lengthIndex >= 0 && lengths.length > 1;
  const pickedIndex = rowIndex >= 0 && rowIndex < groupRows.length ? rowIndex : -1;
  const selected = pickedIndex >= 0 ? groupRows[pickedIndex] : null;
  const basis = selected ?? groupRows[0];
  const { varying } = useMemo(
    () => splitFields(table.columns, groupRows.length ? groupRows : table.rows),
    [groupRows, table.columns, table.rows],
  );

  const fields = basis
    ? orderColumns(table.columns)
        .filter((column) => selected || column !== meta.lengthKey)
        .map((column) => ({ column, value: cell(basis, table.columns, column) }))
    : [];

  const mates = useMemo(() => findMates(meta), [meta]);
  const unit = resolvedUnit(meta.unit, display);
  const converted = display !== "native" && display !== meta.unit;

  function chooseSize(next: string) {
    void navigate({ search: { size: next }, replace: true });
  }

  function chooseLength(next: string) {
    heldLength.current = next;
    if (lengthIndex < 0) return;
    const found = groupRows.findIndex((row) => String(row[lengthIndex] ?? "") === next);
    if (found >= 0) setRowIndex(found);
  }

  async function copySpec() {
    if (!basis) return;
    const text = copyBlock(meta, fields, display);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link
          to="/"
          search={{ q: "", std: meta.group, kind: "", pid: "", nom: "" }}
          className="inline-flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {meta.group} catalog
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              {meta.group} · {meta.kind.charAt(0) + meta.kind.slice(1).toLowerCase()} · {meta.unit === "in" ? "Inch" : "Metric"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">{meta.name}</h1>
            <p className="mt-1 text-muted-foreground">{meta.code}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={saved ? "default" : "outline"} onClick={() => toggle(meta.id, size || null)}>
              <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
              {saved ? "On the bench" : "Save size"}
            </Button>
            <Button variant="outline" onClick={() => void copySpec()}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy callout"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-spec-heading uppercase">Original diagram</h2>
              <p className="text-sm text-muted-foreground">From the fastener book</p>
            </div>
            <div className="mt-3 grid items-center gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
              <div className="flex items-center justify-center rounded-xl bg-white p-2">
                <img src={publicUrl(`fastener/${meta.photo}.png`)} alt="" className="h-28 w-full object-contain" />
              </div>
              <div className="overflow-hidden rounded-xl bg-white p-2">
                <img
                  src={publicUrl(`fastener/${meta.diagram}.png`)}
                  alt={`${meta.name} dimension diagram`}
                  className="mx-auto max-h-96 w-full object-contain"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{readingHint(meta.family)}</p>
          </section>

          <section className="panel flex flex-col p-4 sm:p-5">
            <h2 className="text-sm font-medium">Read this size</h2>
            <div role="radiogroup" aria-label="Display units" className="mt-3 flex w-full min-w-0 gap-1 rounded-xl border border-border bg-background p-1">
              {(
                [
                  ["native", "Published"],
                  ["mm", "mm"],
                  ["in", "inch"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={display === value}
                  onClick={() => setDisplay(value)}
                  className={cn(
                    "motion-colors h-11 min-w-0 flex-1 rounded-lg px-2 text-sm",
                    display === value ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {converted ? `Converted from ${meta.unit}. Rounded for reading.` : `Values stay in ${unit}, the way the standard prints them.`}
            </p>
            {needsLength && !selected ? (
              <p className="mt-4 border-l-2 border-spec-heading pl-3 text-base">Pick a length to finish this callout.</p>
            ) : basis ? (
              <p className="mt-4 border-l-2 border-primary pl-3 text-base">{plainSentence(meta, fields, display)}</p>
            ) : null}
          </section>
        </div>

        <section className="panel mt-4 bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <SearchSelect
              label="Size"
              value={size}
              placeholder="Select a size"
              searchPlaceholder="Search sizes"
              empty="No size matches that"
              options={sizes.map((item) => ({ value: item, label: prettySize(item) }))}
              onChange={chooseSize}
            />
            {lengthIndex >= 0 ? (
              <SearchSelect
                label="Length"
                value={selected ? String(selected[lengthIndex] ?? "") : ""}
                placeholder={lengths.length ? "Select a length" : "No lengths listed"}
                searchPlaceholder="Search lengths"
                empty="No length matches that"
                options={lengths.map((item) => ({ value: item, label: lengthLabel(item, meta.unit) }))}
                onChange={chooseLength}
              />
            ) : (
              <p className="self-end pb-3 text-sm text-muted-foreground">This standard does not list a separate length.</p>
            )}
          </div>
          {needsLength && !selected ? (
            <p className="mt-3 text-sm text-spec-heading">That length is not made in this size. Choose another.</p>
          ) : null}

          {basis ? (
            <div className="mt-5">
              <h2 className="text-sm font-semibold tracking-wide text-spec-heading uppercase">Technical specifications</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="tabular-nums">{sizes.length}</span> sizes
                {lengths.length ? <span> · <span className="tabular-nums">{lengths.length}</span> lengths for this size</span> : null}
              </p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {orderColumns(table.columns)
                  .filter((column) => column !== meta.sizeKey)
                  .map((column) => {
                    const varyingNow = varying.includes(column);
                    const value = varyingNow && !selected ? null : cell(basis, table.columns, column);
                    const formatted = value == null ? null : formatCell(column, value, meta.unit, display);
                    const key = calloutKey(column);
                    return (
                      <div key={column} className="rounded-lg border border-border px-3 py-2">
                        <dt className="text-sm text-muted-foreground">
                          {key ? <span className="mr-2 font-medium text-foreground">{key}</span> : null}
                          {labelFor(column, meta.family)}
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-spec tabular-nums" title={formatted?.title}>
                          {formatted ? (
                            <>
                              {formatted.text}
                              {formatted.unit ? <span className="ml-1 text-sm font-medium">{formatted.unit}</span> : null}
                            </>
                          ) : (
                            "Select a length"
                          )}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
            </div>
          ) : null}
        </section>

        {varying.length > 0 && groupRows.length > 1 ? (
          <section className="panel mt-4 p-4 sm:p-5">
            <h2 className="font-display text-lg font-medium">Lengths for this size</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select a row to copy that exact callout.</p>
            <div className="mt-3 max-w-full overflow-x-auto">
              <table className="w-max min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Pick</th>
                    {varying.map((column) => (
                      <th key={column} className="px-3 py-2 font-medium">
                        {labelFor(column, meta.family)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((row, index) => (
                    <tr key={index} className={cn("border-b border-border last:border-0", index === pickedIndex && "bg-picked")}>
                      <td className="px-3 py-1">
                        <button
                          type="button"
                          className="h-11 rounded-lg px-2 text-sm font-medium text-primary"
                          onClick={() => {
                            if (lengthIndex >= 0) heldLength.current = String(row[lengthIndex] ?? "");
                            setRowIndex(index);
                          }}
                          aria-pressed={index === pickedIndex}
                        >
                          {index === pickedIndex ? "Selected" : "Select"}
                        </button>
                      </td>
                      {varying.map((column) => {
                        const formatted = formatCell(column, cell(row, table.columns, column), meta.unit, display);
                        return (
                          <td key={column} className="px-3 py-2 tabular-nums" title={formatted.title}>
                            {formatted.text}
                            {formatted.unit ? <span className="ml-1 text-muted-foreground">{formatted.unit}</span> : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {mates.length > 0 ? (
          <section className="mt-4">
            <h2 className="font-display text-lg font-medium">Usually goes with</h2>
            <p className="mt-1 text-sm text-muted-foreground">Same standard family, matching nominal size. Check the pitch before you pair them.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {mates.map((mate) => (
                <li key={mate.id}>
                  <Link
                    to="/part/$partId"
                    params={{ partId: mate.id }}
                    search={{ size: "" }}
                    className="panel block p-4 hover:border-primary"
                  >
                    <p className="text-sm text-primary">{mate.kind === "NUT" ? "Nut" : mate.kind === "WASHER" ? "Washer" : "Bolt"}</p>
                    <p className="mt-1 font-medium">{mate.name}</p>
                    <p className="text-sm text-muted-foreground">{mate.code}</p>
                    <p className="mt-2 text-sm tabular-nums">Shares {mate.note}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function rowsOf(table: TableData, meta: PartMeta, size: string): Cell[][] {
  const rows = size ? rowsForSize(table, meta.sizeKey, size) : table.rows;
  if (!meta.lengthKey) return rows;
  const index = table.columns.indexOf(meta.lengthKey);
  if (index < 0) return rows;
  return [...rows].sort((a, b) => lengthRank(a[index]) - lengthRank(b[index]));
}

function prettySize(size: string): string {
  return size.replace(/x(?=\d)/gi, " × ");
}

function lengthLabel(value: string, unit: PartMeta["unit"]): string {
  if (/[a-z]/i.test(value)) return value;
  return unit === "in" ? `${value} in` : `${value} mm`;
}

function lengthRank(value: Cell): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const frac = value.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function PartPending() {
  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-4 w-28 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-4 h-10 w-2/3 max-w-md rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-6 h-64 rounded-3xl bg-muted motion-safe:animate-pulse" />
      </main>
    </Shell>
  );
}

function PartMissing() {
  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display text-3xl font-medium">That fastener is not in the book</h1>
        <p className="mt-2 text-muted-foreground">It may have been renamed. Head back to the catalog.</p>
                    <Link to="/" search={{ q: "", std: "", kind: "", pid: "", nom: "" }} className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Browse the catalog
        </Link>
      </main>
    </Shell>
  );
}

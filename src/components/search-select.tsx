import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

export function SearchSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search",
  empty = "No matches",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/×/g, "x").replace(/\s+/g, "");
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().replace(/×/g, "x").replace(/\s+/g, "").includes(needle));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    field.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(next: string) {
    onChange(next);
    close();
  }

  return (
    <div ref={root} className="relative min-w-0">
      <span id={`${listId}-label`} className="mb-1 block text-sm font-semibold tracking-wide text-spec-heading uppercase">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}${selected ? `, ${selected.label}` : ""}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-base shadow-sm",
          value ? "border-picked-foreground/20 bg-picked text-picked-foreground" : "border-border bg-white text-foreground",
        )}
      >
        <span className="truncate tabular-nums">{selected?.label || placeholder}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-56 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={field}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && shown[0]) {
                  event.preventDefault();
                  choose(shown[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button type="button" className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={() => setQuery("")} aria-label="Clear search">
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <ul id={listId} role="listbox" aria-labelledby={`${listId}-label`} className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">{empty}</li>
            ) : (
              shown.map((option) => {
                const on = option.value === value && option.value !== "";
                return (
                  <li key={option.value || "any"} role="option" aria-selected={option.value === value}>
                    <button
                      type="button"
                      onClick={() => choose(option.value)}
                      className={cn(
                        "flex min-h-11 w-full items-center px-3 text-left text-base tabular-nums",
                        on ? "bg-picked font-medium text-picked-foreground" : "hover:bg-muted",
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

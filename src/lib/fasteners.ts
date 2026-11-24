import catalogRaw from "@/data/catalog.json?raw";

export type Group = "ISO" | "DIN" | "JIS" | "ASTM";
export type Kind = "BOLT" | "NUT" | "WASHER" | "PIN";
export type Unit = "mm" | "in";
export type DisplayUnit = "native" | "mm" | "in";
export type Family =
  | "hex-bolt"
  | "hex-flange"
  | "countersunk"
  | "button"
  | "set-screw"
  | "socket"
  | "square-bolt"
  | "cap-nut"
  | "hex-nut"
  | "flange-nut"
  | "slotted-nut"
  | "square-nut"
  | "wing-nut"
  | "clevis"
  | "dowel"
  | "taper-pin"
  | "plain-washer"
  | "spring-washer"
  | "taper-washer"
  | "square-washer";

export type PartMeta = {
  id: string;
  group: Group;
  name: string;
  kind: Kind;
  code: string;
  family: Family;
  table: string;
  unit: Unit;
  count: number;
  sizeKey: string;
  lengthKey: string | null;
  sizes: string[];
  diagram: string;
  photo: string;
};

export type Cell = string | number | null;
export type TableData = { columns: string[]; rows: Cell[][] };
export type GroupFile = Record<string, TableData>;

type CatalogFile = { parts: PartMeta[]; rowCount: number };

const catalog = JSON.parse(catalogRaw) as CatalogFile;

export const parts: PartMeta[] = catalog.parts;
export const rowCount = catalog.rowCount;

const byId = new Map(parts.map((part) => [part.id, part]));

export function getPart(id: string): PartMeta | null {
  return byId.get(id) ?? null;
}

export const GROUPS: { id: Group; label: string; blurb: string }[] = [
  { id: "ISO", label: "ISO", blurb: "International metric" },
  { id: "DIN", label: "DIN", blurb: "German standards" },
  { id: "JIS", label: "JIS", blurb: "Japanese standards" },
  { id: "ASTM", label: "ASTM", blurb: "US inch and metric" },
];

export const KINDS: { id: Kind; label: string }[] = [
  { id: "BOLT", label: "Bolts" },
  { id: "NUT", label: "Nuts" },
  { id: "WASHER", label: "Washers" },
  { id: "PIN", label: "Pins" },
];

export function countParts(group?: string, kind?: string): number {
  return parts.filter((part) => {
    if (group && part.group !== group) return false;
    if (kind && part.kind !== kind) return false;
    return true;
  }).length;
}

const loaders: Record<Group, () => Promise<GroupFile>> = {
  ASTM: () => import("@/data/astm.json?raw").then(parseFile),
  DIN: () => import("@/data/din.json?raw").then(parseFile),
  ISO: () => import("@/data/iso.json?raw").then(parseFile),
  JIS: () => import("@/data/jis.json?raw").then(parseFile),
};

const cache = new Map<Group, Promise<GroupFile>>();

function parseFile(mod: { default: string }): GroupFile {
  return JSON.parse(mod.default) as GroupFile;
}

export function loadGroup(group: Group): Promise<GroupFile> {
  let pending = cache.get(group);
  if (!pending) {
    pending = loaders[group]();
    cache.set(group, pending);
  }
  return pending;
}

export function sizeRank(size: string): number {
  const metric = size.match(/M\s*(\d+(?:\.\d+)?)/i);
  if (metric) return Number(metric[1]);
  const hash = size.match(/#\s*(\d+)/);
  if (hash) return 0.06 + Number(hash[1]) * 0.013;
  const frac = size.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = size.match(/(\d+(?:\.\d+)?)/);
  if (num) return Number(num[1]);
  return 10000;
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b, undefined, { numeric: true }),
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/×/g, "x").replace(/\s+/g, "");
}

function sizeToken(size: string): string | null {
  const metric = size.match(/M\s*(\d+(?:\.\d+)?)/i);
  if (metric) return `M${metric[1]}`;
  const hash = size.match(/#\s*(\d+)/);
  if (hash) return `#${hash[1]}`;
  const frac = size.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return `${frac[1]}/${frac[2]}`;
  const num = size.match(/^(\d+(?:\.\d+)?)/);
  if (num) return num[1];
  return null;
}

function sizeHit(size: string, token: string): boolean {
  const compact = normalize(size);
  if (compact === token) return true;
  let index = compact.indexOf(token);
  while (index !== -1) {
    const next = compact[index + token.length] ?? "";
    const prev = index === 0 ? "" : compact[index - 1];
    const prevOk = index === 0 || !/[0-9.]/.test(prev);
    const nextOk = !next || !/[0-9.]/.test(next);
    if (prevOk && nextOk) return true;
    index = compact.indexOf(token, index + 1);
  }
  if (/^\d+(?:\.\d+)?$/.test(token)) {
    const metric = compact.match(/^m(\d+(?:\.\d+)?)(?:x|$)/);
    if (metric && metric[1] === token) return true;
    if (compact.startsWith(`${token}-`) || compact.startsWith(`${token}x`)) return true;
  }
  return false;
}

export function preferredSize(sizes: string[], requested = ""): string {
  if (requested && sizes.includes(requested)) return requested;
  const hints = ["m8", "m10", "m6", "1/4", "3/8", "5/16", "#10"];
  for (const hint of hints) {
    const match = sizes.find((size) => sizeHit(size, hint));
    if (match) return match;
  }
  return sizes[0] ?? "";
}

export function nominalOf(size: string): string {
  const metric = size.match(/M\s*(\d+(?:\.\d+)?)/i);
  if (metric) return `M${metric[1]}`;
  const numbered = size.match(/No\.?\s*(\d+)/i);
  if (numbered) return `No. ${numbered[1]}`;
  const hash = size.match(/#\s*(\d+)/);
  if (hash) return `#${hash[1]}`;
  const frac = size.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return `${frac[1]}/${frac[2]}`;
  const num = size.match(/(\d+(?:\.\d+)?)/);
  if (num) return num[1];
  return size;
}

export function sizeMatches(size: string, nominal: string): boolean {
  if (!nominal) return true;
  if (size === nominal) return true;
  if (nominalOf(size) === nominal) return true;
  return sizeHit(size, normalize(nominal));
}

export function matchingSize(sizes: string[], nominal: string): string {
  if (!nominal) return "";
  return sizes.find((size) => sizeMatches(size, nominal)) ?? "";
}

export function searchParts(query: string, group: string, kind: string, nominal = "", id = ""): PartMeta[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const pool = parts.filter((part) => {
    if (id && part.id !== id) return false;
    if (group && part.group !== group) return false;
    if (kind && part.kind !== kind) return false;
    if (nominal && !part.sizes.some((size) => sizeMatches(size, nominal))) return false;
    return true;
  });

  if (!tokens.length) return pool;

  const scored: { part: PartMeta; score: number }[] = [];
  for (const part of pool) {
    const blob = normalize(`${part.name} ${part.code} ${part.group} ${part.kind}`);
    const spaced = `${part.name} ${part.code} ${part.group} ${part.kind}`.toLowerCase();
    let score = 0;
    let ok = true;
    for (const token of tokens) {
      const compact = normalize(token);
      if (spaced.includes(token) || blob.includes(compact)) {
        score += part.code.toLowerCase().includes(token) ? 50 : 24;
        if (part.name.toLowerCase().startsWith(token)) score += 20;
        continue;
      }
      if (part.sizes.some((size) => sizeHit(size, compact))) {
        score += 44;
        continue;
      }
      ok = false;
      break;
    }
    if (ok) scored.push({ part, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.part.group.localeCompare(b.part.group) || a.part.name.localeCompare(b.part.name),
  );
  return scored.map((item) => item.part);
}

export type Mate = {
  id: string;
  name: string;
  code: string;
  kind: Kind;
  note: string;
};

export function findMates(meta: PartMeta): Mate[] {
  if (meta.kind === "PIN") return [];
  const want: Kind[] =
    meta.kind === "BOLT" ? ["NUT", "WASHER"] : meta.kind === "NUT" ? ["BOLT", "WASHER"] : ["BOLT", "NUT"];
  const mine = new Set(meta.sizes.map(sizeToken).filter((token): token is string => Boolean(token)));
  if (!mine.size) return [];

  const matches: Mate[] = [];
  for (const other of parts) {
    if (other.id === meta.id || other.group !== meta.group || other.unit !== meta.unit) continue;
    if (!want.includes(other.kind)) continue;
    const shared: string[] = [];
    const seen = new Set<string>();
    for (const size of other.sizes) {
      const token = sizeToken(size);
      if (token && mine.has(token) && !seen.has(token)) {
        seen.add(token);
        shared.push(token);
      }
    }
    if (!shared.length) continue;
    shared.sort((a, b) => sizeRank(a) - sizeRank(b));
    const shown = shared.slice(0, 4).join(", ");
    const extra = shared.length > 4 ? ` +${shared.length - 4}` : "";
    matches.push({
      id: other.id,
      name: other.name,
      code: other.code,
      kind: other.kind,
      note: `${shown}${extra}`,
    });
  }

  const rank: Record<Kind, number> = { NUT: 0, WASHER: 1, BOLT: 2, PIN: 3 };
  matches.sort((a, b) => rank[a.kind] - rank[b.kind] || a.name.localeCompare(b.name));
  const caps: Record<Kind, number> = { NUT: 3, WASHER: 2, BOLT: 3, PIN: 0 };
  const used: Record<Kind, number> = { NUT: 0, WASHER: 0, BOLT: 0, PIN: 0 };
  return matches.filter((mate) => {
    if (used[mate.kind] >= caps[mate.kind]) return false;
    used[mate.kind] += 1;
    return true;
  });
}

export function cell(row: Cell[], columns: string[], key: string): Cell | undefined {
  const index = columns.indexOf(key);
  if (index < 0) return undefined;
  return row[index];
}

export function rowsForSize(table: TableData, sizeKey: string, size: string): Cell[][] {
  const index = table.columns.indexOf(sizeKey);
  if (index < 0) return table.rows;
  return table.rows.filter((row) => String(row[index] ?? "") === size);
}

const COL_ORDER = [
  "Thread_Size",
  "Bolt_Size",
  "Pin_Size",
  "Washer_Size",
  "Size",
  "Thread",
  "Dia",
  "D",
  "Pitch",
  "Thread_Pitch",
  "Pitch_Diameter",
  "PitchDiameter",
  "Pitch_Dia",
  "L",
  "Length",
  "B",
  "Full_Thread",
  "K",
  "S",
  "E",
  "F",
  "T",
  "Washer_Thickness",
  "R",
  "R1",
  "R2",
  "C",
  "P",
  "H",
  "W",
  "A",
  "Angle",
  "Class",
  "Type",
  "Cap_Type",
  "Thread_Type",
  "Standard",
];

export function orderColumns(columns: string[]): string[] {
  return [...columns].sort((a, b) => {
    const ai = COL_ORDER.indexOf(a);
    const bi = COL_ORDER.indexOf(b);
    return (ai === -1 ? 80 : ai) - (bi === -1 ? 80 : bi) || a.localeCompare(b);
  });
}

export function splitFields(columns: string[], rows: Cell[][]): { fixed: string[]; varying: string[] } {
  const fixed: string[] = [];
  const varying: string[] = [];
  for (const column of orderColumns(columns)) {
    const values = new Set(rows.map((row) => JSON.stringify(cell(row, columns, column) ?? null)));
    if (values.size <= 1) fixed.push(column);
    else varying.push(column);
  }
  return { fixed, varying };
}

import type { Cell, DisplayUnit, Family, PartMeta, Unit } from "@/lib/fasteners";

const LABELS: Record<string, string> = {
  Thread_Size: "Thread",
  Dia: "Nominal diameter",
  D: "Diameter",
  Pitch: "Pitch",
  Thread_Type: "Thread series",
  Standard: "Standard note",
  L: "Length",
  B: "Thread length",
  K: "Head height",
  S: "Across flats",
  E: "Across corners",
  F: "Head or flange diameter",
  T: "Thickness",
  R: "Underhead radius",
  R1: "Inner radius",
  R2: "Outer radius",
  Pitch_Diameter: "Pitch diameter",
  PitchDiameter: "Pitch diameter",
  Pitch_Dia: "Pitch diameter",
  Class: "Tolerance class",
  Washer_Thickness: "Flange thickness",
  Thread: "Thread series",
  Length: "Length",
  Thread_per_Unit: "Threads per unit",
  Cone_Point_Diameter: "Point diameter",
  Angle: "Head angle",
  Pin_Size: "Pin diameter",
  C: "Width C",
  P: "Hole position",
  X: "End projection",
  Size: "Size",
  Bottom_Chamfer: "Point chamfer",
  Head_Chamfer: "Head chamfer",
  Bottom_Chamfer_Angle: "Point chamfer angle",
  Head_Chamfer_Angle: "Head chamfer angle",
  Bolt_Size: "Fits bolt",
  Washer_Size: "Washer size",
  Bolt_Dia: "Bolt diameter",
  Nose_Radius: "Dome radius",
  Body_Radius: "Body radius",
  Full_Thread: "Full thread length",
  Thread_Pitch: "Pitch",
  H: "Slot depth",
  W: "Slot width",
  Number_Grooves: "Slots",
  Cap_Type: "Cap style",
  Type: "Style",
  A: "Outside width",
  Section_Width: "Section width",
};

function humanize(column: string): string {
  return column.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function labelFor(column: string, family: Family): string {
  const washer = family.endsWith("washer");
  const nut = family.endsWith("nut");
  const pin = family === "clevis" || family === "dowel" || family === "taper-pin";
  if (washer && column === "D") return "Hole diameter";
  if (washer && column === "E") return "Outside diameter";
  if (washer && column === "T") return "Thickness";
  if ((family === "socket" || family === "set-screw" || family === "button" || family === "countersunk") && column === "S") {
    return "Hex key size";
  }
  if (family === "socket" && column === "E") return "Head diameter";
  if (family === "countersunk" && column === "F") return "Head diameter";
  if (family === "countersunk" && column === "E") return "Head height";
  if (family === "hex-flange" && column === "F") return "Flange diameter";
  if (family === "flange-nut" && column === "F") return "Flange diameter";
  if ((family === "hex-bolt" || family === "square-bolt" || nut) && column === "S") return "Wrench size";
  if (nut && column === "T") return "Nut thickness";
  if (nut && column === "E") return "Across corners";
  if (pin && column === "D") return "Pin diameter";
  if (pin && column === "L") return "Length";
  if (!washer && !pin && column === "D") return "Shank diameter";
  return LABELS[column] ?? humanize(column);
}

export function calloutKey(column: string): string | null {
  if ("LBKSEFTRDCPHWAX".includes(column) && column.length === 1) return column;
  if (column === "Dia" || column === "Bolt_Dia" || column === "Pin_Size") return "D";
  if (column === "Pitch" || column === "Thread_Pitch") return "P";
  if (column === "R1") return "R1";
  if (column === "R2") return "R2";
  if (column === "Angle" || column.endsWith("_Angle")) return "∠";
  if (column === "Washer_Thickness") return "t";
  return null;
}

export function readingHint(family: Family): string {
  if (family === "socket" || family === "set-screw" || family === "button" || family === "countersunk") {
    return "S is the hex key size. Length is measured under the head, not overall.";
  }
  if (family.endsWith("nut")) {
    return "S is the wrench size across the flats. T is the nut thickness.";
  }
  if (family.endsWith("washer")) {
    return "D is the hole, E is the outside, and T is the thickness.";
  }
  if (family === "clevis" || family === "dowel" || family === "taper-pin") {
    return "D is the pin diameter. L is the length you order.";
  }
  return "Length L is under the head. S is the wrench size. B is how much of the shank is threaded.";
}

function isAngular(column: string): boolean {
  return (
    column === "Angle" ||
    column.endsWith("_Angle") ||
    column === "Number_Grooves" ||
    column === "Thread_per_Unit"
  );
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = y;
    y = x % y;
    x = next;
  }
  return x || 1;
}

function inchFraction(value: number): string | null {
  if (!(value > 0) || value > 24) return null;
  for (const denom of [2, 4, 8, 16, 32, 64]) {
    const num = Math.round(value * denom);
    if (num > 0 && Math.abs(value - num / denom) < 0.0001) {
      const divisor = gcd(num, denom);
      return `${num / divisor}/${denom / divisor}`;
    }
  }
  return null;
}

function trimFixed(value: number, digits: number): string {
  return value
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

export function resolvedUnit(native: Unit, display: DisplayUnit): Unit {
  return display === "native" ? native : display;
}

function convert(column: string, value: number, native: Unit, display: DisplayUnit): number {
  if (isAngular(column) || display === "native" || display === native) return value;
  return display === "mm" ? value * 25.4 : value / 25.4;
}

export function formatCell(
  column: string,
  value: Cell | undefined,
  native: Unit,
  display: DisplayUnit,
): { text: string; title?: string; unit: string } {
  if (value == null || value === "") return { text: "—", unit: "" };
  if (typeof value === "string") return { text: value, unit: "" };

  const unit = isAngular(column) ? "" : resolvedUnit(native, display);
  const converted = convert(column, value, native, display);
  const changed = converted !== value;

  if (column === "Number_Grooves" || column === "Thread_per_Unit") {
    return { text: trimFixed(value, 4), unit: "" };
  }
  if (column === "Angle" || column.endsWith("_Angle")) {
    return { text: `${trimFixed(value, 1)}°`, unit: "" };
  }

  const useFraction = native === "in" && !changed && unit === "in";
  const fraction = useFraction ? inchFraction(converted) : null;
  if (fraction) {
    return { text: fraction, title: `${trimFixed(value, 4)} in`, unit };
  }

  const abs = Math.abs(converted);
  const digits = unit === "mm" ? (abs >= 100 ? 1 : abs >= 10 ? 2 : 3) : abs >= 1 ? 4 : 5;
  const text = trimFixed(converted, digits);
  return {
    text,
    title: changed ? `Published ${trimFixed(value, digits)} ${native}` : undefined,
    unit,
  };
}

export function plainSentence(
  meta: PartMeta,
  fields: { column: string; value: Cell | undefined }[],
  display: DisplayUnit,
): string {
  const find = (column: string) => fields.find((field) => field.column === column)?.value;
  const thread = find("Thread_Size") ?? find("Bolt_Size") ?? find("Pin_Size") ?? find("Size");
  const length = find("L") ?? find("Length");
  const wrench = find("S");
  const unit = resolvedUnit(meta.unit, display);
  const bits = [`${meta.name} (${meta.code}).`];
  if (thread != null && thread !== "") bits.push(`Size ${thread}.`);
  if (typeof length === "number" || (typeof length === "string" && length)) {
    const formatted = formatCell("L", length, meta.unit, display);
    bits.push(`Length ${formatted.text}${formatted.unit ? ` ${formatted.unit}` : ""}.`);
  }
  if (typeof wrench === "number") {
    const formatted = formatCell("S", wrench, meta.unit, display);
    const wrenchLabel = meta.family === "socket" || meta.family === "set-screw" ? "Hex key" : "Wrench";
    bits.push(`${wrenchLabel} ${formatted.text} ${unit}.`);
  }
  return bits.join(" ");
}

export function copyBlock(
  meta: PartMeta,
  fields: { column: string; value: Cell | undefined }[],
  display: DisplayUnit,
): string {
  const lines = [`${meta.name}`, meta.code, meta.group];
  for (const field of fields) {
    if (field.column === "Standard" || field.column === "Thread_Type") continue;
    const formatted = formatCell(field.column, field.value, meta.unit, display);
    if (formatted.text === "—") continue;
    lines.push(`${labelFor(field.column, meta.family)}: ${formatted.text}${formatted.unit ? ` ${formatted.unit}` : ""}`);
  }
  return lines.join("\n");
}

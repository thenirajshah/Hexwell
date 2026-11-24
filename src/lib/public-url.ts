/** Public file URL that respects Vite `base` (GitHub project pages use `/repo/`). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\//, "")}`;
}

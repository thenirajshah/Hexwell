import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <polygon
        points="16,4.2 25.6,9.75 25.6,22.25 16,27.8 6.4,22.25 6.4,9.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="miter"
      />
      <circle cx="16" cy="16" r="4.1" fill="var(--color-primary)" />
    </svg>
  );
}

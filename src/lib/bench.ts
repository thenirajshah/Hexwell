import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DisplayUnit } from "@/lib/fasteners";

export type BenchItem = { id: string; size: string | null; at: number };

type BenchState = {
  items: BenchItem[];
  recent: { id: string; at: number }[];
  display: DisplayUnit;
  toggle: (id: string, size: string | null) => void;
  remove: (id: string, size: string | null) => void;
  touch: (id: string) => void;
  setDisplay: (display: DisplayUnit) => void;
  saved: (id: string, size: string | null) => boolean;
  savedAny: (id: string) => boolean;
};

export const useBench = create<BenchState>()(
  persist(
    (set, get) => ({
      items: [],
      recent: [],
      display: "native",
      toggle: (id, size) =>
        set((state) => {
          const index = state.items.findIndex((item) => item.id === id && item.size === size);
          if (index >= 0) {
            return { items: state.items.filter((_, itemIndex) => itemIndex !== index) };
          }
          return { items: [{ id, size, at: Date.now() }, ...state.items].slice(0, 80) };
        }),
      remove: (id, size) =>
        set((state) => ({
          items: state.items.filter((item) => !(item.id === id && item.size === size)),
        })),
      touch: (id) =>
        set((state) => ({
          recent: [{ id, at: Date.now() }, ...state.recent.filter((item) => item.id !== id)].slice(0, 6),
        })),
      setDisplay: (display) => set({ display }),
      saved: (id, size) => get().items.some((item) => item.id === id && item.size === size),
      savedAny: (id) => get().items.some((item) => item.id === id),
    }),
    { name: "hexwell", skipHydration: true },
  ),
);

let hydrating: Promise<void> | null = null;

export function hydrateBench(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hydrating) {
    hydrating = Promise.resolve(useBench.persist.rehydrate()).then(() => undefined);
  }
  return hydrating;
}

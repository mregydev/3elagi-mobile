import { create } from "zustand";
import type { LayoutRectangle } from "react-native";

type AnchorRects = Record<string, LayoutRectangle>;

interface TourAnchorState {
  rects: AnchorRects;
  setRect: (id: string, rect: LayoutRectangle | null) => void;
  clear: () => void;
}

export const useTourAnchorStore = create<TourAnchorState>((set) => ({
  rects: {},
  setRect: (id, rect) =>
    set((state) => {
      if (!rect) {
        const { [id]: _removed, ...rest } = state.rects;
        return { rects: rest };
      }
      return { rects: { ...state.rects, [id]: rect } };
    }),
  clear: () => set({ rects: {} }),
}));

export function measureAnchorOnWeb(testId: string): LayoutRectangle | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-testid="${testId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

import { create } from "zustand";

type AdFrequencyState = {
  actionCount: number;
  lastShownAt: number | null;
  forceRequested: boolean;
  registerAction: () => void;
  requestForceShow: () => void;
  markShown: (now: number) => void;
};

// Session-only: a new launch cannot immediately show an interstitial.
export const useAdFrequencyStore = create<AdFrequencyState>(set => ({
  actionCount: 0,
  lastShownAt: null,
  forceRequested: false,
  registerAction: () => set(state => ({ actionCount: state.actionCount + 1 })),
  requestForceShow: () => set({ forceRequested: true }),
  markShown: now => set({ actionCount: 0, lastShownAt: now, forceRequested: false }),
}));

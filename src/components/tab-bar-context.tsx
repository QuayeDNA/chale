import { createContext, useContext, type ReactNode } from 'react';

/**
 * Shared metrics for the floating tab bar. The bar and every screen that pads
 * for it read these, so the reserved space can't drift from what's drawn.
 */
export const TAB_BAR_ITEM_HEIGHT = 56;
export const TAB_BAR_PADDING = 8;
export const TAB_BAR_BOTTOM_GAP = 12;
export const TAB_BAR_HEIGHT = TAB_BAR_ITEM_HEIGHT + TAB_BAR_PADDING * 2;
/** Breathing room between the last row of content and the top of the bar. */
export const TAB_BAR_CONTENT_GAP = 16;

/**
 * Padding a scrollable tab screen needs so its last row clears the bar. The
 * screen's own bottom safe-area inset is not included — `Screen` already
 * consumes it, and the bar deliberately floats over that strip.
 */
export const TAB_BAR_CLEARANCE =
  TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + TAB_BAR_CONTENT_GAP;

const TabBarClearanceContext = createContext(0);

/** Wrap the tabs navigator so every scene inside it pads for the floating bar. */
export function TabBarClearanceProvider({ children }: { children: ReactNode }) {
  return (
    <TabBarClearanceContext.Provider value={TAB_BAR_CLEARANCE}>
      {children}
    </TabBarClearanceContext.Provider>
  );
}

/** 0 for screens outside the tabs navigator. */
export function useTabBarClearance(): number {
  return useContext(TabBarClearanceContext);
}

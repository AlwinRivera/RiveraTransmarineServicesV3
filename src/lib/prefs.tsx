// Display preferences for this device only: text size and sun mode.
// Dark mode is handled by Mantine, which remembers it on its own.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type TextSize = 'normal' | 'large' | 'larger';

const SIZE_PERCENT: Record<TextSize, string> = { normal: '100%', large: '112.5%', larger: '125%' };
const KEY = 'rivera-display';

interface Prefs {
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
  sun: boolean;
  setSun: (on: boolean) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

function read(): { textSize: TextSize; sun: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { textSize: v.textSize in SIZE_PERCENT ? v.textSize : 'normal', sun: !!v.sun };
  } catch {
    return { textSize: 'normal', sun: false };
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>(() => read().textSize);
  const [sun, setSun] = useState(() => read().sun);

  useEffect(() => {
    // Every size in the app is in rem, so changing the root size scales everything evenly.
    document.documentElement.style.fontSize = sun && textSize === 'normal' ? SIZE_PERCENT.large : SIZE_PERCENT[textSize];
    document.documentElement.classList.toggle('sun', sun);
    try {
      localStorage.setItem(KEY, JSON.stringify({ textSize, sun }));
    } catch {
      /* private mode: preferences last for this visit only */
    }
  }, [textSize, sun]);

  const value = useMemo(() => ({ textSize, setTextSize, sun, setSun }), [textSize, sun]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const p = useContext(PrefsContext);
  if (!p) throw new Error('usePrefs must be used inside PrefsProvider');
  return p;
}

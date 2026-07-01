import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type Ctx = {
  bottomNavHidden: boolean;
  setBottomNavHidden: (v: boolean) => void;
};

const UiChromeContext = createContext<Ctx>({
  bottomNavHidden: false,
  setBottomNavHidden: () => {},
});

export function UiChromeProvider({ children }: { children: ReactNode }) {
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  return (
    <UiChromeContext.Provider value={{ bottomNavHidden, setBottomNavHidden }}>
      {children}
    </UiChromeContext.Provider>
  );
}

export function useUiChrome() {
  return useContext(UiChromeContext);
}

/** Hide the bottom nav while a component is mounted (open). */
export function useHideBottomNav(active: boolean) {
  const { setBottomNavHidden } = useUiChrome();
  const set = useCallback((v: boolean) => setBottomNavHidden(v), [setBottomNavHidden]);
  useEffect(() => {
    if (!active) return;
    set(true);
    return () => set(false);
  }, [active, set]);
}

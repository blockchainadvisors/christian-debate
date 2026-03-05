"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { THEMES, DEFAULT_THEME, type ThemeId } from "@/lib/themes";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function loadFonts(themeId: ThemeId) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;

  const linkId = "theme-fonts";
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?${theme.fonts
    .split("|")
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;

  if (link) {
    link.href = href;
  } else {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cd-theme") as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    loadFonts(theme);
    localStorage.setItem("cd-theme", theme);
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <div data-theme={DEFAULT_THEME}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

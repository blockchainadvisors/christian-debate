"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { THEMES, type ThemeId } from "@/lib/themes";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = THEMES.find((t) => t.id === theme)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="theme-selector-trigger"
        aria-label="Select theme"
        title="Change theme"
      >
        <span
          className="theme-selector-swatch"
          style={{
            background: `linear-gradient(135deg, ${current.preview.bg} 50%, ${current.preview.accent} 50%)`,
          }}
        />
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`theme-selector-chevron ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="theme-selector-dropdown">
          <div className="theme-selector-header">Choose Theme</div>
          <div className="theme-selector-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as ThemeId);
                  setOpen(false);
                }}
                className={`theme-selector-option ${theme === t.id ? "active" : ""}`}
              >
                <span
                  className="theme-selector-option-swatch"
                  style={{
                    background: t.preview.bg,
                    borderColor: t.preview.accent,
                  }}
                >
                  <span
                    className="theme-selector-option-accent"
                    style={{ background: t.preview.accent }}
                  />
                </span>
                <span className="theme-selector-option-name">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

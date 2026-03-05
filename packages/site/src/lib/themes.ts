export const THEMES = [
  {
    id: "cathedral-dark",
    name: "Cathedral Dark",
    description: "Reverent, dramatic, immersive",
    preview: { bg: "#0f0f0f", accent: "#c9a84c", text: "#e8e4d9" },
    fonts: "Cinzel:wght@400;600;700|Crimson+Pro:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "warm-parchment",
    name: "Warm Parchment",
    description: "Scholarly, inviting, treasured",
    preview: { bg: "#f4edd3", accent: "#b8860b", text: "#5c4033" },
    fonts: "Cormorant+Garamond:wght@400;600;700|EB+Garamond:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "nordic-clean",
    name: "Nordic Clean",
    description: "Calm, functional, trustworthy",
    preview: { bg: "#f7f7f5", accent: "#3b82f6", text: "#1e293b" },
    fonts: "DM+Sans:wght@400;500;600;700|Karla:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "ink-and-paper",
    name: "Ink & Paper",
    description: "Premium, content-first editorial",
    preview: { bg: "#ffffff", accent: "#b91c1c", text: "#111111" },
    fonts: "Playfair+Display:wght@400;600;700;800|Source+Serif+4:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "forest-deep",
    name: "Forest Deep",
    description: "Contemplative, grounded, natural",
    preview: { bg: "#1a2418", accent: "#6b8f5e", text: "#e8e4d9" },
    fonts: "Bitter:wght@400;600;700|Nunito+Sans:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "neon-terminal",
    name: "Neon Terminal",
    description: "Hacker forum meets theology",
    preview: { bg: "#0a0a0a", accent: "#00e5ff", text: "#cccccc" },
    fonts: "Orbitron:wght@400;600;700|JetBrains+Mono:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "byzantine-gold",
    name: "Byzantine Gold",
    description: "Imperial debate chamber",
    preview: { bg: "#0d1442", accent: "#ffd700", text: "#fdf5e6" },
    fonts: "Uncial+Antiqua|Vollkorn:ital,wght@0,400;0,600;0,700;1,400|Merriweather:ital,wght@0,400;0,700;1,400",
  },
  {
    id: "soft-cloud",
    name: "Soft Cloud",
    description: "Calm, approachable, cozy",
    preview: { bg: "#f8f7ff", accent: "#c4b5fd", text: "#374151" },
    fonts: "Nunito:wght@400;600;700;800|Quicksand:wght@400;500;600;700",
  },
  {
    id: "art-deco",
    name: "Art Deco Debate",
    description: "1920s Grand Hotel salon",
    preview: { bg: "#0a1628", accent: "#c9a84c", text: "#f0e6d3" },
    fonts: "Poiret+One|Raleway:ital,wght@0,400;0,500;0,600;0,700;1,400",
  },
  {
    id: "slate-academic",
    name: "Slate Academic",
    description: "Oxford lecture hall gravitas",
    preview: { bg: "#fffff0", accent: "#a51c30", text: "#002147" },
    fonts: "Libre+Baskerville:ital,wght@0,400;0,700;1,400|Lora:ital,wght@0,400;0,600;0,700;1,400",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "nordic-clean";

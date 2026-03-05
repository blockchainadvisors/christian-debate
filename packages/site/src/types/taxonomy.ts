export type ArgumentTaxonomy =
  | "empirical"
  | "moral_ethical"
  | "economic"
  | "procedural"
  | "anecdotal"
  | "legal"
  | "historical";

export type TaxonomyTag = {
  taxonomy: ArgumentTaxonomy;
  count: number;
};

export const TAXONOMY_VALUES: ArgumentTaxonomy[] = [
  "empirical",
  "moral_ethical",
  "economic",
  "procedural",
  "anecdotal",
  "legal",
  "historical",
];

export type TaxonomyMeta = {
  label: string;
  description: string;
  color: string;
  icon: string;
};

export const TAXONOMY_META: Record<ArgumentTaxonomy, TaxonomyMeta> = {
  empirical: {
    label: "Empirical",
    description: "Based on data, studies, or observable evidence",
    color: "green",
    icon: "FlaskConical",
  },
  moral_ethical: {
    label: "Moral/Ethical",
    description: "Appeals to morality, ethics, or values",
    color: "purple",
    icon: "Heart",
  },
  economic: {
    label: "Economic",
    description: "Focuses on costs, benefits, or financial impact",
    color: "amber",
    icon: "DollarSign",
  },
  procedural: {
    label: "Procedural",
    description: "About process, rules, or governance",
    color: "blue",
    icon: "ClipboardList",
  },
  anecdotal: {
    label: "Anecdotal",
    description: "Personal experience or individual story",
    color: "orange",
    icon: "MessageCircle",
  },
  legal: {
    label: "Legal",
    description: "References laws, regulations, or legal precedent",
    color: "indigo",
    icon: "Scale",
  },
  historical: {
    label: "Historical",
    description: "Draws on historical events or patterns",
    color: "teal",
    icon: "Clock",
  },
};

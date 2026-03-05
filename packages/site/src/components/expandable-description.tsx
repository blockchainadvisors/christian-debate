"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableDescriptionProps {
  text: string;
  maxLines?: number;
}

export function ExpandableDescription({
  text,
  maxLines = 4,
}: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [text]);

  return (
    <div className="debate-description">
      <p
        ref={ref}
        className="text-muted-foreground leading-relaxed"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

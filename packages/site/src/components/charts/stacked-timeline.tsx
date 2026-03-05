"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface TimelineEntry {
  date: string;
  segments: Segment[];
}

interface StackedTimelineProps {
  data: TimelineEntry[];
}

export function StackedTimeline({ data }: StackedTimelineProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No timeline data yet.</p>
    );
  }

  const maxTotal = Math.max(
    ...data.map((entry) =>
      entry.segments.reduce((sum, seg) => sum + seg.value, 0)
    ),
    1
  );

  const barMaxHeight = 140;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: barMaxHeight }}>
        {data.map((entry, i) => {
          const total = entry.segments.reduce((sum, seg) => sum + seg.value, 0);
          const stackHeight = (total / maxTotal) * barMaxHeight;

          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center justify-end"
              style={{ height: barMaxHeight }}
            >
              <span className="mb-1 text-[10px] text-muted-foreground tabular-nums">
                {total}
              </span>
              <div
                className="flex w-full min-w-2 flex-col-reverse overflow-hidden rounded-t"
                style={{ height: stackHeight, minHeight: total > 0 ? 4 : 0 }}
              >
                {entry.segments.map((seg, j) => {
                  const segHeight =
                    total > 0 ? (seg.value / total) * stackHeight : 0;
                  return (
                    <div
                      key={j}
                      style={{
                        height: segHeight,
                        backgroundColor: seg.color,
                        minHeight: seg.value > 0 ? 2 : 0,
                      }}
                      title={`${seg.label}: ${seg.value}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {data.map((entry, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground">
              {formatDateLabel(entry.date)}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      {data[0] && (
        <div className="flex flex-wrap gap-3 pt-1">
          {data[0].segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

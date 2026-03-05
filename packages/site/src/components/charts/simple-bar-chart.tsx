"use client";

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  maxHeight?: number;
  showLabels?: boolean;
}

export function SimpleBarChart({
  data,
  maxHeight = 160,
  showLabels = true,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2" style={{ height: maxHeight }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * maxHeight;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            style={{ height: maxHeight }}
          >
            <span className="text-xs text-muted-foreground tabular-nums">
              {item.value}
            </span>
            <div
              className="w-full min-w-3 rounded-t transition-all duration-300"
              style={{
                height: barHeight,
                backgroundColor: item.color,
                minHeight: item.value > 0 ? 4 : 0,
              }}
            />
            {showLabels && (
              <span className="max-w-full truncate text-[10px] text-muted-foreground">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

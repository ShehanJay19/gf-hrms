type Point = {
  label: string;
  value: number;
  secondaryLabel?: string;
};

type Props = {
  points: Point[];
  valueFormatter?: (value: number) => string;
  height?: number;
};

export default function TrendBarChart({ points, valueFormatter = (v) => String(v), height = 220 }: Props) {
  if (points.length === 0) {
    return <p className="state-body">No data to chart yet.</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const barWidth = 100 / points.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
        {points.map((point, index) => {
          const barHeight = (point.value / max) * (height - 40);
          const x = index * barWidth + barWidth * 0.15;
          const width = barWidth * 0.7;
          const y = height - 24 - barHeight;
          return (
            <g key={point.label}>
              <rect x={x} y={y} width={width} height={barHeight} rx={1.5} fill="var(--color-brand-600)" />
              <text
                x={x + width / 2}
                y={y - 4}
                fontSize={3.6}
                textAnchor="middle"
                fill="var(--color-ink-500)"
              >
                {valueFormatter(point.value)}
              </text>
              <text
                x={x + width / 2}
                y={height - 10}
                fontSize={3.6}
                textAnchor="middle"
                fill="var(--color-ink-500)"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

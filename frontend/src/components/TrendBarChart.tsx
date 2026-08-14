type Point = {
  label: string;
  value: number;
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        height,
        padding: '8px 4px 0',
      }}
    >
      {points.map((point) => {
        const barHeight = Math.max((point.value / max) * (height - 48), 2);
        return (
          <div
            key={point.label}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-ink-500)', marginBottom: 4 }}>{valueFormatter(point.value)}</span>
            <div
              style={{
                width: '100%',
                maxWidth: 56,
                height: barHeight,
                borderRadius: '4px 4px 0 0',
                background: 'var(--color-brand-600)',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--color-ink-500)', marginTop: 6 }}>{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

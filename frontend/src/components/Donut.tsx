type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  segments: Segment[];
  centerValue: string;
  centerLabel: string;
};

export default function Donut({ segments, centerValue, centerLabel }: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 15.5;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut-figure">
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth="6" />
          {segments.map((seg) => {
            const frac = seg.value / total;
            const len = frac * circumference;
            const el = (
              <circle
                key={seg.label}
                cx="20"
                cy="20"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="6"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="donut-center">
          <div className="donut-center-value">{centerValue}</div>
          <div className="donut-center-label">{centerLabel}</div>
        </div>
      </div>

      <div className="legend">
        {segments.map((seg) => (
          <div className="legend-row" key={seg.label}>
            <span className="legend-swatch" style={{ background: seg.color }} />
            <span className="legend-label">{seg.label}</span>
            <span className="legend-value">{seg.value}</span>
            <span className="legend-pct">{total ? Math.round((seg.value / total) * 1000) / 10 : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

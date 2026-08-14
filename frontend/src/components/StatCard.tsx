import type { ReactNode } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  tone?: Tone;
};

export default function StatCard({ label, value, delta, tone = 'default' }: Props) {
  return (
    <article className={`stat-card ${tone === 'default' ? '' : tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </article>
  );
}

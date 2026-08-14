type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_TONE: Record<string, Tone> = {
  present: 'success',
  active: 'success',
  approved: 'success',
  paid: 'success',
  absent: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  inactive: 'neutral',
  half_day: 'warning',
  late: 'warning',
  pending: 'warning',
  draft: 'neutral',
  on_leave: 'info',
  holiday: 'info',
  off_day: 'neutral',
};

function labelize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type Props = {
  status: string;
  tone?: Tone;
};

export default function StatusPill({ status, tone }: Props) {
  const resolvedTone = tone ?? STATUS_TONE[status.toLowerCase()] ?? 'neutral';
  return <span className={`pill pill-${resolvedTone}`}>{labelize(status)}</span>;
}

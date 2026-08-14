import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { getDailyAttendance, getMonthlySummary } from '../../lib/api/attendance';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function calLevel(rate: number | null) {
  if (rate === null) return undefined;
  if (rate >= 96) return '4';
  if (rate >= 90) return '3';
  if (rate >= 82) return '2';
  return '1';
}

function CalendarHeatmap({ year, month }: { year: number; month: number }) {
  const [rates, setRates] = useState<Array<number | null> | null>(null);

  useEffect(() => {
    let active = true;
    setRates(null);

    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const lastDay = isCurrentMonth ? today.getDate() : today < new Date(year, month - 1, 1) ? 0 : daysInMonth;

    const requests = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      if (day > lastDay) return Promise.resolve(null);
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return getDailyAttendance(iso)
        .then((report) => report.attendance_rate)
        .catch(() => null);
    });

    Promise.all(requests).then((values) => {
      if (active) setRates(values);
    });

    return () => {
      active = false;
    };
  }, [year, month]);

  if (!rates) {
    return <Skeleton rows={4} />;
  }

  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0

  return (
    <div>
      <div className="cal-legend" style={{ marginBottom: 12, justifyContent: 'flex-end', display: 'flex' }}>
        Low
        <div className="cal-scale">
          <span style={{ background: 'var(--color-surface-2)' }} />
          <span style={{ background: 'var(--color-success-bg)' }} />
          <span style={{ background: '#86efac' }} />
          <span style={{ background: '#4ade80' }} />
          <span style={{ background: 'var(--color-success-fg)' }} />
        </div>
        High
      </div>
      <div className="cal-grid">
        {DOW_LABELS.map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div className="cal-cell empty" key={`pad-${i}`} />
        ))}
        {rates.map((rate, idx) => (
          <div className="cal-cell" data-level={calLevel(rate)} key={idx} title={rate === null ? 'No data' : `${rate}% attendance`}>
            {idx + 1}
            {rate !== null && <span className="rate">{rate}%</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AttendanceMonthlyPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchSummary = useCallback(() => getMonthlySummary(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetchSummary, [year, month]);

  return (
    <div>
      <PageHeader title="Monthly Attendance" subtitle="Daily heatmap and per-employee summary — used for payroll processing." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="input" style={{ width: 140 }} value={month} onChange={(event) => setMonth(Number(event.target.value))}>
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <input
          className="input"
          style={{ width: 120 }}
          type="number"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        />
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div>
            <p className="panel-title">Monthly Heatmap</p>
            <p className="panel-subtitle">Attendance rate per day</p>
          </div>
        </div>
        <CalendarHeatmap year={year} month={month} />
      </section>

      {loading && <Skeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && data.length === 0 && <EmptyState title="No data for this month" body="No active employees or attendance records found." />}

      {data && data.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Per-Employee Summary</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Emp No</th>
                  <th>Employee</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>On Leave</th>
                  <th>OT Hours</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.employee_id}>
                    <td>{row.employee_no}</td>
                    <td className="cell-primary">{row.full_name}</td>
                    <td>{row.present_days}</td>
                    <td>{row.absent_days}</td>
                    <td>{row.on_leave_days}</td>
                    <td>{row.total_ot_hours.toFixed(1)}</td>
                    <td>{row.attendance_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

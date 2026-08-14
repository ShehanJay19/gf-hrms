import { useCallback, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { getMonthlySummary } from '../../lib/api/attendance';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AttendanceMonthlyPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchSummary = useCallback(() => getMonthlySummary(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetchSummary, [year, month]);

  return (
    <div>
      <PageHeader title="Monthly Attendance Summary" subtitle="Aggregated attendance per employee — used for payroll processing." />

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

      {loading && <Skeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && data.length === 0 && <EmptyState title="No data for this month" body="No active employees or attendance records found." />}

      {data && data.length > 0 && (
        <section className="panel">
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

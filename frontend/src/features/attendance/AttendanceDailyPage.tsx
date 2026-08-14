import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusPill from '../../components/StatusPill';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES, SUPERVISOR_ROLES } from '../../lib/roles';
import { getDailyAttendance } from '../../lib/api/attendance';
import ManualAttendanceModal from './ManualAttendanceModal';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceDailyPage() {
  const { user } = useAuth();
  const canManualEntry = hasRole(user?.role, SUPERVISOR_ROLES);
  const canSeeMonthly = hasRole(user?.role, HR_MANAGER_ROLES);

  const [date, setDate] = useState(todayIso());
  const [showManualEntry, setShowManualEntry] = useState(false);

  const fetchDaily = useCallback(() => getDailyAttendance(date), [date]);
  const { data, loading, error, refetch } = useApiQuery(fetchDaily, [date]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Daily attendance across the factory floor."
        actions={
          <>
            {canSeeMonthly && (
              <Link to="/attendance/monthly" className="btn btn-secondary">
                Monthly View
              </Link>
            )}
            {canManualEntry && (
              <button type="button" className="btn btn-primary" onClick={() => setShowManualEntry(true)}>
                + Manual Entry
              </button>
            )}
          </>
        }
      />

      <div className="field" style={{ maxWidth: 220, marginBottom: 20 }}>
        <label className="field-label">Report Date</label>
        <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      {loading && <Skeleton rows={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && (
        <>
          <section className="stats-grid">
            <StatCard label="Total Workforce" value={String(data.total_employees)} tone="info" />
            <StatCard label="Present" value={String(data.present)} tone="success" />
            <StatCard label="Absent" value={String(data.absent)} tone="danger" />
            <StatCard label="On Leave" value={String(data.on_leave)} />
            <StatCard label="Attendance Rate" value={`${data.attendance_rate}%`} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Employee Records</p>
                <p className="panel-subtitle">{data.records.length} record(s) for {data.date}</p>
              </div>
            </div>

            {data.records.length === 0 ? (
              <EmptyState title="No attendance recorded" body="No punches or manual entries exist for this date yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Worked Hrs</th>
                      <th>Late (min)</th>
                      <th>OT Hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((record) => (
                      <tr key={record.id}>
                        <td>{record.employee_id}</td>
                        <td>{record.check_in ?? '—'}</td>
                        <td>{record.check_out ?? '—'}</td>
                        <td>
                          <StatusPill status={record.status} />
                        </td>
                        <td>{record.worked_hours}</td>
                        <td style={{ color: record.late_minutes > 0 ? 'var(--color-danger-fg)' : undefined }}>
                          {record.late_minutes || '—'}
                        </td>
                        <td>{record.ot_hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showManualEntry && (
        <ManualAttendanceModal
          defaultDate={date}
          onClose={() => setShowManualEntry(false)}
          onSaved={() => {
            setShowManualEntry(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

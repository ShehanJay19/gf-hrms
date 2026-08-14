import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES, SUPERVISOR_ROLES } from '../../lib/roles';
import { createManualAttendance, getDailyAttendance } from '../../lib/api/attendance';
import { listEmployees, type EmployeeListItem } from '../../lib/api/employees';
import ManualAttendanceModal from './ManualAttendanceModal';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

export default function AttendanceDailyPage() {
  const { user } = useAuth();
  const canManualEntry = hasRole(user?.role, SUPERVISOR_ROLES);
  const canSeeMonthly = hasRole(user?.role, HR_MANAGER_ROLES);

  const [date, setDate] = useState(todayIso());
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const fetchDaily = useCallback(() => getDailyAttendance(date), [date]);
  const { data, loading, error, refetch } = useApiQuery(fetchDaily, [date]);

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((result) => setEmployees(result.employees))
      .catch(() => setEmployees([]));
  }, []);

  const nameFor = (employeeId: number) => employees.find((e) => e.id === employeeId)?.full_name ?? `Employee #${employeeId}`;

  const recordedIds = new Set((data?.records ?? []).map((r) => r.employee_id));
  const absentees = employees.filter((e) => !recordedIds.has(e.id));
  const isToday = date === todayIso();

  const selectedIds = Object.keys(selected)
    .filter((id) => selected[Number(id)])
    .map(Number);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const clearSelection = () => setSelected({});

  const runBulk = async (mode: 'present' | 'absent') => {
    setBulkBusy(true);
    setBulkError(null);
    let failures = 0;
    for (const employeeId of selectedIds) {
      try {
        await createManualAttendance({
          employee_id: employeeId,
          date,
          check_in: mode === 'present' ? nowTime() : undefined,
        });
      } catch {
        failures += 1;
      }
    }
    setBulkBusy(false);
    clearSelection();
    refetch();
    if (failures > 0) {
      setBulkError(`${failures} of ${selectedIds.length} entries failed — they may already have a record for this date.`);
    }
  };

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
        <input className="input" type="date" value={date} onChange={(event) => { setDate(event.target.value); clearSelection(); }} />
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
                <p className="panel-subtitle">
                  {data.records.length} record(s) for {data.date}
                </p>
              </div>
            </div>

            {data.records.length === 0 ? (
              <EmptyState title="No attendance recorded" body="No punches or manual entries exist for this date yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
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
                        <td>
                          <div className="cell-person">
                            <Avatar name={nameFor(record.employee_id)} />
                            <div className="cell-primary">{nameFor(record.employee_id)}</div>
                          </div>
                        </td>
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

          {canManualEntry && absentees.length > 0 && (
            <section className="panel" style={{ marginTop: 16 }}>
              <div className={`bulk-bar ${selectedIds.length > 0 ? 'show' : ''}`}>
                <span>{selectedIds.length} selected</span>
                <div className="bulk-spacer" />
                <button type="button" className="btn btn-primary btn-sm" disabled={bulkBusy || !isToday} onClick={() => runBulk('present')}>
                  <Icon name="check" size={14} /> Mark Present
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={bulkBusy} onClick={() => runBulk('absent')}>
                  <Icon name="x" size={14} /> Flag Absent
                </button>
                <button type="button" className="bulk-clear" onClick={clearSelection}>
                  Clear selection
                </button>
              </div>
              <div className="panel-header">
                <div>
                  <p className="panel-title">Not Yet Recorded</p>
                  <p className="panel-subtitle">
                    {absentees.length} employee(s) with no attendance entry for {date}
                    {!isToday && ' — bulk "Mark Present" only applies to today'}
                  </p>
                </div>
              </div>
              {bulkError && <div className="auth-error" style={{ marginBottom: 12 }}>{bulkError}</div>}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === absentees.length}
                          onChange={(event) => {
                            const next: Record<number, boolean> = {};
                            absentees.forEach((e) => (next[e.id] = event.target.checked));
                            setSelected(next);
                          }}
                        />
                      </th>
                      <th>Employee</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentees.map((employee) => (
                      <tr key={employee.id} className={selected[employee.id] ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={Boolean(selected[employee.id])}
                            onChange={(event) => toggleSelect(employee.id, event.target.checked)}
                          />
                        </td>
                        <td>
                          <div className="cell-person">
                            <Avatar name={employee.full_name} />
                            <div className="cell-primary">{employee.full_name}</div>
                          </div>
                        </td>
                        <td>{employee.department?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
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

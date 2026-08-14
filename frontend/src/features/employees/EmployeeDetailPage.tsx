import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES } from '../../lib/roles';
import { deactivateEmployee, getEmployee } from '../../lib/api/employees';
import { getEmployeeAttendance } from '../../lib/api/attendance';
import { listEmployeeLeaves } from '../../lib/api/attendance';

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = hasRole(user?.role, HR_MANAGER_ROLES);
  const [showDeactivate, setShowDeactivate] = useState(false);

  const fetchEmployee = useCallback(() => getEmployee(employeeId), [employeeId]);
  const { data: employee, loading, error, refetch } = useApiQuery(fetchEmployee, [employeeId]);

  const period = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }, []);

  const fetchAttendance = useCallback(
    () => getEmployeeAttendance(employeeId, period.start, period.end),
    [employeeId, period],
  );
  const { data: attendance } = useApiQuery(fetchAttendance, [employeeId, period]);

  const fetchLeaves = useCallback(() => listEmployeeLeaves(employeeId), [employeeId]);
  const { data: leaves } = useApiQuery(fetchLeaves, [employeeId]);

  const deactivateMutation = useApiMutation(() => deactivateEmployee(employeeId));

  if (loading) {
    return <Skeleton rows={6} />;
  }

  if (error || !employee) {
    return <ErrorState message={error ?? 'Employee not found.'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={employee.full_name}
        subtitle={`${employee.employee_no} · ${employee.designation?.name ?? 'No designation'} · ${employee.department?.name ?? 'No department'}`}
        actions={
          canManage && (
            <>
              <Link to={`/employees/${employee.id}/edit`} className="btn btn-secondary">
                Edit
              </Link>
              {employee.is_active && (
                <button type="button" className="btn btn-danger" onClick={() => setShowDeactivate(true)}>
                  Deactivate
                </button>
              )}
            </>
          )
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section className="form-section">
          <div className="form-section-title">Personal & Contact</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: 0 }}>
            <Field label="Status" value={<StatusPill status={employee.is_active ? 'active' : 'inactive'} />} />
            <Field label="Gender" value={employee.gender} />
            <Field label="NIC" value={employee.nic} />
            <Field label="Date of Birth" value={new Date(employee.date_of_birth).toLocaleDateString()} />
            <Field label="Mobile" value={employee.mobile ?? '—'} />
            <Field label="Email" value={employee.email ?? '—'} />
          </dl>
        </section>

        <section className="form-section">
          <div className="form-section-title">Employment & Salary</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: 0 }}>
            <Field label="Employment Type" value={employee.employment_type} />
            <Field label="Joined" value={new Date(employee.joined_date).toLocaleDateString()} />
            <Field label="Section" value={employee.section?.name ?? '—'} />
            <Field label="Basic Salary" value={`৳ ${Number(employee.basic_salary).toLocaleString()}`} />
            <Field label="EPF No" value={employee.epf_no ?? '—'} />
            <Field label="Biometric ID" value={employee.biometric_id ?? '—'} />
          </dl>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <p className="panel-title">Attendance — Last 30 Days</p>
            <p className="panel-subtitle">
              {attendance
                ? `${attendance.summary.present_days} present · ${attendance.summary.absent_days} absent · ${attendance.summary.attendance_rate}% rate`
                : 'Loading…'}
            </p>
          </div>
        </div>
        {attendance && attendance.records.length === 0 && <p className="state-body">No attendance records in this period.</p>}
        {attendance && attendance.records.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>OT Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.records.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.check_in ?? '—'}</td>
                    <td>{record.check_out ?? '—'}</td>
                    <td>
                      <StatusPill status={record.status} />
                    </td>
                    <td>{record.ot_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <p className="panel-title">Leave History</p>
          </div>
        </div>
        {leaves && leaves.length === 0 && <p className="state-body">No leave requests yet.</p>}
        {leaves && leaves.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.leave_type}</td>
                    <td>
                      {new Date(leave.start_date).toLocaleDateString()} – {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td>{leave.total_days}</td>
                    <td>
                      <StatusPill status={leave.status} />
                    </td>
                    <td>{leave.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showDeactivate && (
        <ConfirmDialog
          title="Deactivate employee"
          body={`This will mark ${employee.full_name} as inactive. They will no longer appear in the default employee list.`}
          confirmLabel="Deactivate"
          danger
          loading={deactivateMutation.loading}
          onCancel={() => setShowDeactivate(false)}
          onConfirm={async () => {
            await deactivateMutation.mutate();
            setShowDeactivate(false);
            navigate('/employees');
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 2 }}>
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

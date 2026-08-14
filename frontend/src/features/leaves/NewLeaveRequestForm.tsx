import { useEffect, useState, type FormEvent } from 'react';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { applyLeave, type LeaveType } from '../../lib/api/attendance';
import { listEmployees, type EmployeeListItem } from '../../lib/api/employees';

const LEAVE_TYPES: LeaveType[] = ['annual', 'casual', 'medical', 'maternity', 'no_pay', 'other'];

export default function NewLeaveRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((result) => setEmployees(result.employees))
      .catch(() => setEmployees([]));
  }, []);

  const mutation = useApiMutation(applyLeave);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({
      employee_id: Number(employeeId),
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || undefined,
    });
    setStartDate('');
    setEndDate('');
    setReason('');
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="form-section-title">New Leave Request</div>
      <div className="form-grid cols-3">
        <div className="field">
          <label className="field-label">Employee</label>
          <select className="input" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.employee_no} — {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Leave Type</label>
          <select className="input" value={leaveType} onChange={(event) => setLeaveType(event.target.value as LeaveType)}>
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type[0].toUpperCase() + type.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div />

        <div className="field">
          <label className="field-label">Start Date</label>
          <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">End Date</label>
          <input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Reason</label>
        <textarea className="input" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>

      {mutation.error && <div className="auth-error">{mutation.error}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={mutation.loading || !employeeId}>
          {mutation.loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import Modal from '../../components/Modal';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { createManualAttendance } from '../../lib/api/attendance';
import { listEmployees, type EmployeeListItem } from '../../lib/api/employees';

type Props = {
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function ManualAttendanceModal({ defaultDate, onClose, onSaved }: Props) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((result) => setEmployees(result.employees))
      .catch(() => setEmployees([]));
  }, []);

  const mutation = useApiMutation(createManualAttendance);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({
      employee_id: Number(employeeId),
      date,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      notes: notes || undefined,
    });
    onSaved();
  };

  return (
    <Modal title="Manual Attendance Entry" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <label className="field-label">Date</label>
          <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field-label">Check In</label>
            <input className="input" type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Check Out</label>
            <input className="input" type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Notes</label>
          <textarea className="input" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {mutation.error && <div className="auth-error">{mutation.error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.loading || !employeeId}>
            {mutation.loading ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

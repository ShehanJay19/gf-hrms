import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { createPayrollRun } from '../../lib/api/payroll';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayrollRunFormPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [notes, setNotes] = useState('');

  const mutation = useApiMutation(createPayrollRun);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const run = await mutation.mutate({ month, year, notes: notes || undefined });
    navigate(`/payroll/runs/${run.id}`);
  };

  return (
    <div>
      <PageHeader title="Create Payroll Run" subtitle="Start a new payroll cycle for a specific month." />

      <form onSubmit={handleSubmit} className="form-section" style={{ maxWidth: 480 }}>
        <div className="form-grid">
          <div className="field">
            <label className="field-label">Month</label>
            <select className="input" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Year</label>
            <input className="input" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Notes</label>
          <textarea className="input" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {mutation.error && <div className="auth-error">{mutation.error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
            {mutation.loading ? 'Creating…' : 'Create Run'}
          </button>
        </div>
      </form>
    </div>
  );
}

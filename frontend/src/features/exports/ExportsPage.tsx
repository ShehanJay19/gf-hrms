import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { listPayrollRuns, getPayrollRunSummary, type PayrollRun, type Payslip } from '../../lib/api/payroll';
import { downloadAttendanceExcel, downloadEpfEtfExcel, downloadPayrollRegister, downloadPayslipPdf } from '../../lib/api/exports';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ExportsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [runId, setRunId] = useState<number | ''>('');
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payslipEmployeeId, setPayslipEmployeeId] = useState<number | ''>('');
  const now = new Date();
  const [attendanceYear, setAttendanceYear] = useState(now.getFullYear());
  const [attendanceMonth, setAttendanceMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    listPayrollRuns()
      .then((result) => {
        const sorted = [...result].sort((a, b) => b.year - a.year || b.month - a.month);
        setRuns(sorted);
        if (sorted[0]) {
          setRunId(sorted[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load payroll runs.'));
  }, []);

  useEffect(() => {
    if (runId === '') {
      setPayslips([]);
      return;
    }
    getPayrollRunSummary(runId)
      .then((summary) => {
        setPayslips(summary.payslips);
        setPayslipEmployeeId(summary.payslips[0]?.employee_id ?? '');
      })
      .catch(() => setPayslips([]));
  }, [runId]);

  const runTask = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download file.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Data Export Center" subtitle="Generate and download official garment factory documentation." />

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <article className="panel">
          <h3 className="panel-title">Payroll Register (Excel)</h3>
          <p className="panel-subtitle">Full breakdown of monthly salaries and deductions.</p>
          <div style={{ marginTop: 12 }}>
            <select className="input" value={runId} onChange={(event) => setRunId(event.target.value ? Number(event.target.value) : '')}>
              <option value="">Select payroll run</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {MONTH_NAMES[run.month - 1]} {run.year} — {run.status}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={runId === '' || busy !== null}
                onClick={() => runId !== '' && runTask('register', () => downloadPayrollRegister(runId))}
              >
                {busy === 'register' ? 'Downloading…' : 'Download Register'}
              </button>
            </div>
          </div>
        </article>

        <article className="panel">
          <h3 className="panel-title">EPF/ETF Report (Excel)</h3>
          <p className="panel-subtitle">Mandatory statutory contribution compliance report.</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ marginTop: 40 }}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={runId === '' || busy !== null}
                onClick={() => runId !== '' && runTask('epf', () => downloadEpfEtfExcel(runId))}
              >
                {busy === 'epf' ? 'Downloading…' : 'Download Statutory Report'}
              </button>
            </div>
          </div>
        </article>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <article className="panel">
          <h3 className="panel-title">Attendance Report (Excel)</h3>
          <p className="panel-subtitle">Floor worker clock-in/out and OT summary.</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <select className="input" value={attendanceMonth} onChange={(event) => setAttendanceMonth(Number(event.target.value))}>
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              value={attendanceYear}
              onChange={(event) => setAttendanceYear(Number(event.target.value))}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy !== null}
              onClick={() => runTask('attendance', () => downloadAttendanceExcel(attendanceYear, attendanceMonth))}
            >
              {busy === 'attendance' ? 'Downloading…' : 'Generate Attendance Export'}
            </button>
          </div>
        </article>

        <article className="panel">
          <h3 className="panel-title">Employee Payslip (PDF)</h3>
          <p className="panel-subtitle">Individual payslip generation from a processed payroll run.</p>
          <div style={{ marginTop: 12 }}>
            <select
              className="input"
              value={payslipEmployeeId}
              onChange={(event) => setPayslipEmployeeId(event.target.value ? Number(event.target.value) : '')}
              disabled={payslips.length === 0}
            >
              {payslips.length === 0 ? (
                <option value="">No payslips for this run yet</option>
              ) : (
                payslips.map((payslip) => (
                  <option key={payslip.employee_id} value={payslip.employee_id}>
                    Employee #{payslip.employee_id} — ৳ {Number(payslip.net_salary).toLocaleString()} net
                  </option>
                ))
              )}
            </select>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={runId === '' || payslipEmployeeId === '' || busy !== null}
                onClick={() =>
                  runId !== '' &&
                  payslipEmployeeId !== '' &&
                  runTask('payslip', () => downloadPayslipPdf(runId, payslipEmployeeId))
                }
              >
                {busy === 'payslip' ? 'Downloading…' : 'Download Payslip'}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { getPayslip } from '../../lib/api/payroll';
import { downloadPayslipPdf } from '../../lib/api/exports';

function money(value: string | number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(Number(value));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-ink-50)' }}>
      <span className="cell-secondary">{label}</span>
      <span className="cell-primary">{value}</span>
    </div>
  );
}

export default function PayslipPage() {
  const { id, employeeId } = useParams();
  const runId = Number(id);
  const empId = Number(employeeId);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchPayslip = useCallback(() => getPayslip(runId, empId), [runId, empId]);
  const { data, loading, error, refetch } = useApiQuery(fetchPayslip, [runId, empId]);

  if (loading) {
    return <Skeleton rows={8} />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? 'Payslip not found.'} onRetry={refetch} />;
  }

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadPayslipPdf(runId, empId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to download payslip.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Payslip — Employee #${data.employee_id}`}
        subtitle={`Payroll run #${data.payroll_run_id}`}
        actions={
          <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading…' : 'Download PDF'}
          </button>
        }
      />

      {downloadError && <div className="auth-error" style={{ marginBottom: 16 }}>{downloadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section className="form-section">
          <div className="form-section-title">Attendance</div>
          <Row label="Working Days" value={String(data.working_days)} />
          <Row label="Present Days" value={data.present_days} />
          <Row label="Absent Days" value={data.absent_days} />
          <Row label="No-Pay Days" value={data.no_pay_days} />
          <Row label="OT Hours" value={data.ot_hours} />
        </section>

        <section className="form-section">
          <div className="form-section-title">Earnings</div>
          <Row label="Basic Salary" value={`৳ ${money(data.basic_salary)}`} />
          <Row label="OT Amount" value={`৳ ${money(data.ot_amount)}`} />
          <Row label="Attendance Allowance" value={`৳ ${money(data.attendance_allow)}`} />
          <Row label="Transport Allowance" value={`৳ ${money(data.transport_allow)}`} />
          <Row label="Meal Allowance" value={`৳ ${money(data.meal_allow)}`} />
          <Row label="Other Allowance" value={`৳ ${money(data.other_allow)}`} />
          <Row label="Gross Salary" value={`৳ ${money(data.gross_salary)}`} />
        </section>

        <section className="form-section">
          <div className="form-section-title">Deductions</div>
          <Row label="EPF (Employee, 8%)" value={`৳ ${money(data.epf_employee)}`} />
          <Row label="No-Pay Deduction" value={`৳ ${money(data.no_pay_deduct)}`} />
          <Row label="Loan Deduction" value={`৳ ${money(data.loan_deduct)}`} />
          <Row label="Other Deduction" value={`৳ ${money(data.other_deduct)}`} />
          <Row label="Total Deductions" value={`৳ ${money(data.total_deductions)}`} />
        </section>

        <section className="form-section">
          <div className="form-section-title">Employer Contributions & Net</div>
          <Row label="EPF (Employer, 12%)" value={`৳ ${money(data.epf_employer)}`} />
          <Row label="ETF (3%)" value={`৳ ${money(data.etf_employer)}`} />
          <Row label="Net Salary" value={`৳ ${money(data.net_salary)}`} />
        </section>
      </div>
    </div>
  );
}

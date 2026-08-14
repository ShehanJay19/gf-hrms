import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusPill from '../../components/StatusPill';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES, PAYROLL_ROLES } from '../../lib/roles';
import { approvePayrollRun, getPayrollRunSummary, processPayrollRun } from '../../lib/api/payroll';
import { downloadEpfEtfExcel, downloadPayrollRegister } from '../../lib/api/exports';

function money(value: string | number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(Number(value));
}

export default function PayrollRunDetailPage() {
  const { id } = useParams();
  const runId = Number(id);
  const { user } = useAuth();
  const canApprove = hasRole(user?.role, HR_MANAGER_ROLES);
  const canProcess = hasRole(user?.role, PAYROLL_ROLES);

  const [confirmAction, setConfirmAction] = useState<'process' | 'approve' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchSummary = useCallback(() => getPayrollRunSummary(runId), [runId]);
  const { data, loading, error, refetch } = useApiQuery(fetchSummary, [runId]);

  const processMutation = useApiMutation(() => processPayrollRun(runId));
  const approveMutation = useApiMutation(() => approvePayrollRun(runId));

  if (loading) {
    return <Skeleton rows={6} />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? 'Payroll run not found.'} onRetry={refetch} />;
  }

  const handleDownload = async (task: () => Promise<void>) => {
    setDownloadError(null);
    try {
      await task();
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to download file.');
    }
  };

  return (
    <div>
      <PageHeader
        title={`Payroll Run — ${data.month}/${data.year}`}
        subtitle={`${data.total_employees} employee(s) · Status: ${data.status}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => handleDownload(() => downloadPayrollRegister(runId))}>
              Download Register
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => handleDownload(() => downloadEpfEtfExcel(runId))}>
              Download EPF/ETF
            </button>
            {canProcess && data.status === 'draft' && (
              <button type="button" className="btn btn-primary" onClick={() => setConfirmAction('process')}>
                Process Payroll
              </button>
            )}
            {canApprove && data.status === 'pending' && (
              <button type="button" className="btn btn-primary" onClick={() => setConfirmAction('approve')}>
                Approve Payroll
              </button>
            )}
          </>
        }
      />

      {downloadError && <div className="auth-error" style={{ marginBottom: 16 }}>{downloadError}</div>}

      <section className="stats-grid">
        <StatCard label="Status" value={<StatusPill status={data.status} />} />
        <StatCard label="Total Gross" value={`৳ ${money(data.total_gross)}`} />
        <StatCard label="Total Net" value={`৳ ${money(data.total_net)}`} />
        <StatCard label="Total OT Cost" value={`৳ ${money(data.total_ot_cost)}`} />
        <StatCard label="EPF (Employee)" value={`৳ ${money(data.total_epf_employee)}`} />
        <StatCard label="EPF (Employer)" value={`৳ ${money(data.total_epf_employer)}`} />
        <StatCard label="ETF" value={`৳ ${money(data.total_etf)}`} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Payslips</p>
            <p className="panel-subtitle">{data.payslips.length} payslip(s) generated for this run.</p>
          </div>
        </div>

        {data.payslips.length === 0 ? (
          <p className="state-body">No payslips yet — process this run to generate them.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Basic</th>
                  <th>OT</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td>{payslip.employee_id}</td>
                    <td>৳ {money(payslip.basic_salary)}</td>
                    <td>৳ {money(payslip.ot_amount)}</td>
                    <td>৳ {money(payslip.gross_salary)}</td>
                    <td>৳ {money(payslip.total_deductions)}</td>
                    <td className="cell-primary">৳ {money(payslip.net_salary)}</td>
                    <td>
                      <Link to={`/payroll/runs/${runId}/payslips/${payslip.employee_id}`} className="btn btn-ghost btn-sm">
                        View Payslip →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmAction === 'process' && (
        <ConfirmDialog
          title="Process payroll"
          body="This calculates payslips for all active employees. Any existing payslips for this run will be overwritten."
          confirmLabel="Process"
          loading={processMutation.loading}
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            await processMutation.mutate();
            setConfirmAction(null);
            refetch();
          }}
        />
      )}

      {confirmAction === 'approve' && (
        <ConfirmDialog
          title="Approve payroll"
          body="This finalizes the payroll run. Make sure the payslip totals have been reviewed."
          confirmLabel="Approve"
          loading={approveMutation.loading}
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            await approveMutation.mutate();
            setConfirmAction(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

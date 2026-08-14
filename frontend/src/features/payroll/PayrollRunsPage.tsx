import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useAuth } from '../../app/AuthContext';
import { hasRole, PAYROLL_ROLES } from '../../lib/roles';
import { listPayrollRuns } from '../../lib/api/payroll';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayrollRunsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = hasRole(user?.role, PAYROLL_ROLES);

  const fetchRuns = useCallback(() => listPayrollRuns(), []);
  const { data, loading, error, refetch } = useApiQuery(fetchRuns, []);

  const sorted = data ? [...data].sort((a, b) => b.year - a.year || b.month - a.month) : [];

  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        subtitle="Manage monthly payroll cycles, processing, and approvals."
        actions={
          canCreate && (
            <Link to="/payroll/runs/new" className="btn btn-primary">
              + Create Payroll Run
            </Link>
          )
        }
      />

      {loading && <Skeleton rows={5} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && sorted.length === 0 && (
        <EmptyState title="No payroll runs yet" body="Create the first payroll run to get started." />
      )}

      {data && sorted.length > 0 && (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month/Year</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((run) => (
                  <tr key={run.id} onClick={() => navigate(`/payroll/runs/${run.id}`)} style={{ cursor: 'pointer' }}>
                    <td className="cell-primary">
                      {MONTH_NAMES[run.month - 1]} {run.year}
                    </td>
                    <td>
                      {new Date(run.period_start).toLocaleDateString()} – {new Date(run.period_end).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusPill status={run.status} />
                    </td>
                    <td className="cell-secondary">{run.notes ?? '—'}</td>
                    <td>
                      <Link to={`/payroll/runs/${run.id}`} className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}>
                        View →
                      </Link>
                    </td>
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

import { useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { getDashboardKpis } from '../../lib/api/reports';

function money(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value);
}

export default function DashboardPage() {
  const fetchKpis = useCallback(() => getDashboardKpis(), []);
  const { data, loading, error, refetch } = useApiQuery(fetchKpis, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time overview of workforce, attendance, and payroll health." />

      {loading && <Skeleton rows={5} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && (
        <>
          <section className="stats-grid" aria-label="Key metrics">
            <StatCard label="Active Employees" value={String(data.total_active_employees)} tone="info" />
            <StatCard
              label="Attendance Today"
              value={`${data.daily_attendance_rate}%`}
              tone={data.daily_attendance_rate >= 90 ? 'success' : 'danger'}
            />
            <StatCard
              label="Absenteeism (Month)"
              value={`${data.absenteeism_rate}%`}
              tone={data.absenteeism_rate > 10 ? 'warning' : 'default'}
            />
            <StatCard
              label="Turnover (Month)"
              value={`${data.monthly_turnover_rate}%`}
              tone={data.monthly_turnover_rate > 5 ? 'warning' : 'default'}
            />
            <StatCard label="OT Hours (Month)" value={data.total_ot_hours_month.toFixed(1)} />
            <StatCard label="Labour Cost (Month)" value={`৳ ${money(data.total_labour_cost_month)}`} />
            <StatCard label="EPF/ETF Liability" value={`৳ ${money(data.epf_etf_liability_month)}`} />
            <StatCard label="Pending Leave Requests" value={String(data.pending_leave_requests)} tone="info" />
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Alerts</p>
                <p className="panel-subtitle">As of {data.as_of}</p>
              </div>
            </div>

            {data.alerts.length === 0 ? (
              <p className="state-body">No active alerts. Everything is within normal thresholds.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.alerts.map((alert, index) => (
                  <div className={`alert alert-${alert.severity}`} key={index}>
                    <span>{alert.severity === 'critical' ? '⛔' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

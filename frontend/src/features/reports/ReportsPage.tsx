import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import TrendBarChart from '../../components/TrendBarChart';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import {
  getAbsenteeismReport,
  getEmploymentTypeBreakdown,
  getLabourCostByDepartment,
  getLateArrivalReport,
  getOtAnalysis,
  getPayrollTrend,
  getTurnoverReport,
  getWeekdayPattern,
} from '../../lib/api/reports';
import { listPayrollRuns, type PayrollRun } from '../../lib/api/payroll';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
  'Absenteeism',
  'Late Arrivals',
  'OT Analysis',
  'Weekday Pattern',
  'Turnover',
  'Employment Types',
  'Labour Cost',
  'Payroll Trend',
] as const;
type Tab = (typeof TABS)[number];

function money(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value);
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('Absenteeism');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Attendance, workforce, and payroll analytics for decision-making." />

      <div className="tabs">
        {TABS.map((item) => (
          <button key={item} type="button" className={`tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {tab !== 'Employment Types' && tab !== 'Payroll Trend' && tab !== 'Labour Cost' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select className="input" style={{ width: 140 }} value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <input className="input" style={{ width: 120 }} type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
        </div>
      )}

      {tab === 'Absenteeism' && <AbsenteeismTab year={year} month={month} />}
      {tab === 'Late Arrivals' && <LateArrivalsTab year={year} month={month} />}
      {tab === 'OT Analysis' && <OtAnalysisTab year={year} month={month} />}
      {tab === 'Weekday Pattern' && <WeekdayPatternTab year={year} month={month} />}
      {tab === 'Turnover' && <TurnoverTab year={year} month={month} />}
      {tab === 'Employment Types' && <EmploymentTypesTab />}
      {tab === 'Labour Cost' && <LabourCostTab />}
      {tab === 'Payroll Trend' && <PayrollTrendTab />}
    </div>
  );
}

function AbsenteeismTab({ year, month }: { year: number; month: number }) {
  const fetcher = useCallback(() => getAbsenteeismReport(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [year, month]);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.length === 0) return <EmptyState title="No absenteeism data" body="No attendance records found for this month." />;

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Employees</th>
              <th>Avg Attendance Rate</th>
              <th>Total Absent Days</th>
              <th>Chronic Absentees</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.department}>
                <td className="cell-primary">{row.department}</td>
                <td>{row.total_employees}</td>
                <td>{row.avg_attendance_rate}%</td>
                <td>{row.total_absent_days}</td>
                <td>{row.chronic_absentees}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LateArrivalsTab({ year, month }: { year: number; month: number }) {
  const fetcher = useCallback(() => getLateArrivalReport(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [year, month]);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.length === 0) return <EmptyState title="No late arrivals" body="No late check-ins recorded for this month." />;

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Late Count</th>
              <th>Total Late Minutes</th>
              <th>Avg Late Minutes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.employee_id}>
                <td className="cell-primary">{row.full_name} ({row.employee_no})</td>
                <td>{row.department}</td>
                <td>{row.late_count}</td>
                <td>{row.total_late_minutes}</td>
                <td>{row.avg_late_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OtAnalysisTab({ year, month }: { year: number; month: number }) {
  const fetcher = useCallback(() => getOtAnalysis(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [year, month]);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || !data.records || data.records.length === 0) return <EmptyState title="No OT recorded" body="No overtime hours logged for this month." />;

  return (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total OT Hours</div>
          <div className="stat-value">{(data.grand_total_ot_hours ?? 0).toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total OT Cost</div>
          <div className="stat-value">৳ {money(data.grand_total_ot_cost ?? 0)}</div>
        </div>
      </section>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>OT Hours</th>
                <th>OT Cost</th>
                <th>OT Days</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((row) => (
                <tr key={row.employee_id}>
                  <td className="cell-primary">{row.full_name} ({row.employee_no})</td>
                  <td>{row.department}</td>
                  <td>{row.total_ot_hours}</td>
                  <td>৳ {money(row.ot_cost)}</td>
                  <td>{row.ot_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function WeekdayPatternTab({ year, month }: { year: number; month: number }) {
  const fetcher = useCallback(() => getWeekdayPattern(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [year, month]);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || !data.absences_by_weekday) return <EmptyState title="No absence data" body="No absences recorded for this month." />;

  return (
    <section className="panel">
      {data.alert && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <span>⚠️</span>
          <span>Elevated Monday/Friday absenteeism detected — investigate weekend-avoidance patterns.</span>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Weekday</th>
              <th>Absences</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.absences_by_weekday).map(([day, count]) => (
              <tr key={day}>
                <td className="cell-primary">{day}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TurnoverTab({ year, month }: { year: number; month: number }) {
  const fetcher = useCallback(() => getTurnoverReport(year, month), [year, month]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [year, month]);

  if (loading) return <Skeleton rows={3} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <EmptyState title="No turnover data" />;

  return (
    <section className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Total Employees</div>
        <div className="stat-value">{data.total_employees}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">New Hires</div>
        <div className="stat-value">{data.new_hires}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Resignations</div>
        <div className="stat-value">{data.resignations}</div>
      </div>
      <div className={`stat-card ${data.alert ? 'warning' : ''}`}>
        <div className="stat-label">Turnover Rate</div>
        <div className="stat-value">{data.turnover_rate}%</div>
      </div>
    </section>
  );
}

function EmploymentTypesTab() {
  const fetcher = useCallback(() => getEmploymentTypeBreakdown(), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);

  if (loading) return <Skeleton rows={3} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <EmptyState title="No workforce data" />;

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employment Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.breakdown).map(([type, count]) => (
              <tr key={type}>
                <td className="cell-primary">{type}</td>
                <td>{count}</td>
                <td>{data.percentages[type as keyof typeof data.percentages] ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LabourCostTab() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [runId, setRunId] = useState<number | null>(null);

  useEffect(() => {
    listPayrollRuns()
      .then((result) => {
        const sorted = [...result].sort((a, b) => b.year - a.year || b.month - a.month);
        setRuns(sorted);
        setRunId(sorted[0]?.id ?? null);
      })
      .catch(() => setRuns([]));
  }, []);

  const fetcher = useCallback(() => getLabourCostByDepartment(runId as number), [runId]);
  const { data, loading, error, refetch } = useApiQuery(fetcher, [runId]);

  if (runId === null) {
    return <EmptyState title="No payroll runs available" body="Create and process a payroll run to see labour cost by department." />;
  }

  return (
    <>
      <div className="field" style={{ maxWidth: 260, marginBottom: 20 }}>
        <label className="field-label">Payroll Run</label>
        <select className="input" value={runId} onChange={(event) => setRunId(Number(event.target.value))}>
          {runs.map((run) => (
            <option key={run.id} value={run.id}>
              {MONTH_NAMES[run.month - 1]} {run.year} — {run.status}
            </option>
          ))}
        </select>
      </div>

      {loading && <Skeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && data.length === 0 && <EmptyState title="No labour cost data" body="This run hasn't been processed yet." />}

      {data && data.length > 0 && (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Basic</th>
                  <th>OT</th>
                  <th>Allowances</th>
                  <th>Gross</th>
                  <th>Cost / Employee</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.department}>
                    <td className="cell-primary">{row.department}</td>
                    <td>{row.total_employees}</td>
                    <td>৳ {money(row.total_basic)}</td>
                    <td>৳ {money(row.total_ot)}</td>
                    <td>৳ {money(row.total_allowances)}</td>
                    <td>৳ {money(row.total_gross)}</td>
                    <td>৳ {money(row.cost_per_employee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function PayrollTrendTab() {
  const fetcher = useCallback(() => getPayrollTrend(6), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.length === 0) return <EmptyState title="No payroll history" body="Process at least one payroll run to see trends." />;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Gross Payroll — Last {data.length} Runs</p>
        </div>
      </div>
      <TrendBarChart
        points={data.map((point) => ({ label: point.period, value: point.total_gross }))}
        valueFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
      />
    </section>
  );
}

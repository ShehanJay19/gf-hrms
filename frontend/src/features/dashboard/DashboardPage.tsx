import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import Donut from '../../components/Donut';
import TrendBarChart from '../../components/TrendBarChart';
import Icon from '../../components/Icon';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES, PAYROLL_ROLES, SUPERVISOR_ROLES } from '../../lib/roles';
import { getDashboardKpis, type DashboardKpis } from '../../lib/api/reports';
import { getDailyAttendance, listShifts, listPendingLeaves, type Shift, type LeaveRequest, type AttendanceRecord } from '../../lib/api/attendance';
import { listEmployees } from '../../lib/api/employees';

function money(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value);
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

type ActivityItem = {
  key: string;
  icon: string;
  tone: 'success' | 'warning' | 'info';
  text: string;
  createdAt: string;
};

type QuickAction = {
  to: string;
  icon: string;
  label: string;
  desc: string;
  allow?: string[];
};

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/attendance', icon: 'calendar', label: 'Mark Attendance', desc: "Log today's check-ins", allow: SUPERVISOR_ROLES },
  { to: '/employees/new', icon: 'userPlus', label: 'Add New Worker', desc: 'Onboard to the floor', allow: HR_MANAGER_ROLES },
  { to: '/payroll/runs/new', icon: 'cash', label: 'Generate Payroll', desc: "Run this month's payroll", allow: PAYROLL_ROLES },
  { to: '/reports', icon: 'chart', label: 'View Reports', desc: 'Attendance & payroll insights', allow: HR_MANAGER_ROLES },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const canSeeAttendance = hasRole(user?.role, SUPERVISOR_ROLES);

  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [kpisError, setKpisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [todayReport, setTodayReport] = useState<{ present: number; absent: number; on_leave: number; total_employees: number; records: AttendanceRecord[] } | null>(null);
  const [weekTrend, setWeekTrend] = useState<{ day: string; rate: number; today?: boolean }[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let active = true;

    getDashboardKpis()
      .then((data) => active && setKpis(data))
      .catch((err) => active && setKpisError(err instanceof Error ? err.message : 'Unable to load dashboard KPIs.'));

    listShifts()
      .then((data) => active && setShifts(data))
      .catch(() => active && setShifts([]));

    const employeeNamesPromise = listEmployees({ limit: 200 })
      .then((result) => new Map(result.employees.map((e) => [e.id, e.full_name])))
      .catch(() => new Map<number, string>());

    if (canSeeAttendance) {
      const today = new Date();
      const dayPromises = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return getDailyAttendance(toIso(d)).then((report) => ({
          day: DOW[d.getDay()],
          rate: report.attendance_rate,
          today: i === 6,
        }));
      });

      Promise.all(dayPromises)
        .then((rows) => active && setWeekTrend(rows))
        .catch(() => active && setWeekTrend([]));

      const todayReportPromise = getDailyAttendance(toIso(today)).catch(() => null);
      todayReportPromise.then((report) => active && setTodayReport(report));

      Promise.all([
        todayReportPromise,
        listPendingLeaves().catch(() => [] as LeaveRequest[]),
        employeeNamesPromise,
      ]).then(([daily, leaves, names]) => {
        if (!active) return;
        const items: ActivityItem[] = [];

        (daily?.records ?? [])
          .filter((r) => r.check_in)
          .forEach((r) => {
            items.push({
              key: `att-${r.id}`,
              icon: 'login',
              tone: 'success',
              text: `<b>${names.get(r.employee_id) ?? `Employee #${r.employee_id}`}</b> clocked in — ${r.check_in}`,
              createdAt: r.created_at,
            });
          });

        leaves.forEach((l) => {
          items.push({
            key: `leave-${l.id}`,
            icon: 'leave',
            tone: 'warning',
            text: `<b>${names.get(l.employee_id) ?? `Employee #${l.employee_id}`}</b> requested ${l.leave_type} leave`,
            createdAt: l.created_at,
          });
        });

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivity(items.slice(0, 6));
      });
    }

    setLoading(false);

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeAttendance]);

  const donutSegments = useMemo(() => {
    if (!todayReport) return [];
    return [
      { label: 'Present', value: todayReport.present, color: 'var(--color-success-fg)' },
      { label: 'On Leave', value: todayReport.on_leave, color: 'var(--color-info-fg)' },
      { label: 'Absent', value: todayReport.absent, color: 'var(--color-danger-fg)' },
    ];
  }, [todayReport]);

  const visibleActions = QUICK_ACTIONS.filter((a) => !a.allow || hasRole(user?.role, a.allow as never));

  if (loading) {
    return <Skeleton rows={5} />;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time overview of workforce, attendance, and payroll health." />

      {kpisError && <ErrorState message={kpisError} />}

      {kpis && (
        <>
          <section className="stats-grid" aria-label="Key metrics">
            <StatCard label="Active Employees" value={String(kpis.total_active_employees)} tone="info" />
            <StatCard
              label="Attendance Today"
              value={`${kpis.daily_attendance_rate}%`}
              tone={kpis.daily_attendance_rate >= 90 ? 'success' : 'danger'}
            />
            <StatCard label="Absenteeism (Month)" value={`${kpis.absenteeism_rate}%`} tone={kpis.absenteeism_rate > 10 ? 'warning' : 'default'} />
            <StatCard label="Turnover (Month)" value={`${kpis.monthly_turnover_rate}%`} tone={kpis.monthly_turnover_rate > 5 ? 'warning' : 'default'} />
            <StatCard label="OT Hours (Month)" value={kpis.total_ot_hours_month.toFixed(1)} />
            <StatCard label="Labour Cost (Month)" value={`৳ ${money(kpis.total_labour_cost_month)}`} />
            <StatCard label="EPF/ETF Liability" value={`৳ ${money(kpis.epf_etf_liability_month)}`} />
            <StatCard label="Pending Leave Requests" value={String(kpis.pending_leave_requests)} tone="info" />
          </section>

          {kpis.alerts.length > 0 && (
            <section className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header">
                <div>
                  <p className="panel-title">Alerts</p>
                  <p className="panel-subtitle">As of {kpis.as_of}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kpis.alerts.map((alert, index) => (
                  <div className={`alert alert-${alert.severity}`} key={index}>
                    <span>{alert.severity === 'critical' ? '⛔' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {canSeeAttendance && (
        <div className="dash-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Weekly Attendance Trend</p>
                <p className="panel-subtitle">Attendance rate, last 7 days</p>
              </div>
            </div>
            {weekTrend.length > 0 ? (
              <TrendBarChart points={weekTrend.map((d) => ({ label: d.day, value: d.rate }))} valueFormatter={(v) => `${v}%`} height={190} />
            ) : (
              <Skeleton rows={2} />
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Today&apos;s Attendance</p>
                <p className="panel-subtitle">{todayReport?.total_employees ?? '—'} total workforce</p>
              </div>
            </div>
            {todayReport ? (
              <Donut segments={donutSegments} centerValue={`${Math.round(((todayReport.present || 0) / (todayReport.total_employees || 1)) * 100)}%`} centerLabel="Present" />
            ) : (
              <Skeleton rows={2} />
            )}
          </section>
        </div>
      )}

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Shifts</p>
              <p className="panel-subtitle">Configured factory shifts</p>
            </div>
            {hasRole(user?.role, HR_MANAGER_ROLES) && (
              <Link to="/settings" className="btn btn-ghost btn-sm">
                Manage →
              </Link>
            )}
          </div>
          {shifts.length === 0 ? (
            <p className="state-body">No shifts configured yet.</p>
          ) : (
            <div className="shift-list">
              {shifts.map((shift, index) => (
                <div className="shift-row" key={shift.id}>
                  <span
                    className="shift-dot"
                    style={{ background: ['var(--color-accent)', 'var(--color-info-fg)', 'var(--color-brand-800)'][index % 3] }}
                  />
                  <div>
                    <div className="shift-name">{shift.name}</div>
                    <div className="shift-time">
                      {shift.start_time} – {shift.end_time}
                    </div>
                  </div>
                  <div className="shift-count">{shift.code}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div>
              <p className="panel-title">Recent Activity</p>
              <p className="panel-subtitle">Today&apos;s check-ins and leave requests</p>
            </div>
          </div>
          {!canSeeAttendance ? (
            <p className="state-body">Activity requires supervisor access or above.</p>
          ) : activity.length === 0 ? (
            <p className="state-body">No activity recorded yet today.</p>
          ) : (
            <div className="activity-list">
              {activity.map((item) => (
                <div className="activity-item" key={item.key}>
                  <span
                    className="activity-icon"
                    style={{
                      background: `var(--color-${item.tone === 'success' ? 'success-bg' : item.tone === 'warning' ? 'warning-bg' : 'info-bg'})`,
                      color: `var(--color-${item.tone === 'success' ? 'success-fg' : item.tone === 'warning' ? 'warning-fg' : 'info-fg'})`,
                    }}
                  >
                    <Icon name={item.icon} size={14} />
                  </span>
                  <div>
                    <div className="activity-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                    <div className="activity-time">{timeAgo(item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {visibleActions.length > 0 && (
        <section className="panel">
          <p className="panel-title" style={{ marginBottom: 14 }}>
            Quick Actions
          </p>
          <div className="quick-grid">
            {visibleActions.map((action) => (
              <Link className="quick-card" to={action.to} key={action.to}>
                <span className="quick-icon">
                  <Icon name={action.icon} size={18} />
                </span>
                <span>
                  <span className="quick-label">{action.label}</span>
                  <span className="quick-desc">{action.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

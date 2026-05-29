import React, { useState } from 'react';
import Employees from './pages/Employees';
import AddEmployee from './pages/AddEmployee';
import LeaveManagement from './pages/LeaveManagement';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import PayrollRuns from './pages/PayrollRuns';
import Exports from './pages/Exports';
import System from './pages/System';

type StatCard = {
  label: string;
  value: string;
  delta: string;
  tone: 'success' | 'warning' | 'info';
};

type TrendRow = {
  label: string;
  gross: string;
  net: string;
  status: 'Paid' | 'Pending Approval' | 'Draft';
  employees: string;
};

const stats: StatCard[] = [
  { label: 'Total Gross Pay (Oct)', value: '৳ 4.2M', delta: '+2.4% vs last mo.', tone: 'success' },
  { label: 'Employees Paid', value: '1,248', delta: 'Pay run completed', tone: 'info' },
  { label: 'Compliance Status', value: '98.2%', delta: 'Audit ready', tone: 'warning' },
];

const payrollRuns: TrendRow[] = [
  { label: 'Oct 2024', gross: '৳ 4,285,000', net: '৳ 3,842,500', status: 'Paid', employees: '1,248' },
  { label: 'Nov 2024', gross: '৳ 4,310,200', net: '৳ 3,890,100', status: 'Pending Approval', employees: '1,252' },
  { label: 'Dec 2024', gross: '--', net: '--', status: 'Draft', employees: '--' },
  { label: 'Sep 2024', gross: '৳ 4,195,000', net: '৳ 3,755,200', status: 'Paid', employees: '1,240' },
];

const sidebarItems = ['Dashboard', 'Employees', 'Attendance', 'Leave Management', 'Payroll', 'Reports & Analytics', 'Exports', 'System'];

const departmentBars = [
  { name: 'Cutting', values: [82, 18, 12] },
  { name: 'Sewing', values: [94, 26, 14] },
  { name: 'Finishing', values: [70, 14, 10] },
  { name: 'Quality', values: [76, 10, 16] },
  { name: 'Logistics', values: [62, 24, 8] },
];

function PayrollDashboard() {
  return (
    <>
      <header className="topbar">
        <label className="searchbar" aria-label="Search payroll runs">
          <span className="search-icon">⌕</span>
          <input placeholder="Search payroll periods or runs..." />
        </label>

        <div className="topbar-actions">
          <button className="icon-button" type="button">
            <span>🔔</span>
          </button>
          <button className="icon-button" type="button">
            <span>?</span>
          </button>
          <button className="year-chip" type="button">
            FY 2024-25
          </button>
        </div>
      </header>

      <section className="hero-row">
        <div>
          <p className="eyebrow">Payroll Processing</p>
          <h1>Manage monthly payroll cycles, statutory compliance, and distribution.</h1>
        </div>
        <button className="primary-button" type="button">
          <span className="plus">+</span>
          Create Payroll Run
        </button>
      </section>

      <section className="stats-grid" aria-label="Key metrics">
        {stats.map((stat) => (
          <article className={`stat-card ${stat.tone}`} key={stat.label}>
            <div className="stat-delta">{stat.delta}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="panel panel-chart">
          <div className="panel-header">
            <div>
              <p className="panel-title">Departmental Cost Breakdown</p>
              <p className="panel-subtitle">Gross, overtime, and allowances by unit.</p>
            </div>
          </div>

          <div className="bar-chart" aria-label="Departmental payroll chart">
            {departmentBars.map((department) => (
              <div className="bar-group" key={department.name}>
                <div className="bars">
                  {department.values.map((height, index) => (
                    <span
                      className={`bar bar-${index + 1}`}
                      key={`${department.name}-${index}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <span className="bar-name">{department.name}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-compliance">
          <div className="panel-header stack">
            <div>
              <p className="panel-title">Compliance Status</p>
              <p className="panel-subtitle">All statutory items ready for review.</p>
            </div>
            <div className="status-grid" aria-label="Compliance indicators">
              <span className="status-pill success">Tax</span>
              <span className="status-pill success">PF</span>
              <span className="status-pill warning">Ins</span>
            </div>
          </div>

          <div className="compliance-score">
            <div className="ring">
              <span>98.2%</span>
            </div>
            <div>
              <p className="panel-title">Audit Ready</p>
              <p className="panel-subtitle">Variance checks and export validation complete.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel table-panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Recent Payroll Runs</p>
            <p className="panel-subtitle">Latest cycles with approval and export status.</p>
          </div>
          <div className="toolbar-actions">
            <button className="secondary-button" type="button">Filter</button>
            <button className="secondary-button" type="button">Batch Export</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month/Year</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Total Gross</th>
                <th>Total Net</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollRuns.map((run) => (
                <tr key={run.label}>
                  <td>
                    <strong>{run.label}</strong>
                  </td>
                  <td>{run.employees}</td>
                  <td>
                    <span className={`table-status ${run.status.toLowerCase().replace(/\s+/g, '-')}`}>{run.status}</span>
                  </td>
                  <td>{run.gross}</td>
                  <td>
                    <strong>{run.net}</strong>
                  </td>
                  <td>
                    <div className="action-links">
                      <button type="button">View</button>
                      <button type="button">Export</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function App() {
  const [page, setPage] = useState<string>('Payroll');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">GF-HRMS</div>
          <div className="brand-subtitle">Factory Admin</div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {sidebarItems.map((item) => (
            <button
              className={`nav-item ${item === page || (item === 'Dashboard' && page === 'Payroll') ? 'active' : ''}`}
              key={item}
              type="button"
              onClick={() => setPage(item === 'Dashboard' ? 'Payroll' : item)}
            >
              <span className="nav-bullet" />
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">RU</div>
          <div>
            <div className="footer-name">Rahim Uddin</div>
            <div className="footer-role">Payroll Lead</div>
          </div>
        </div>
      </aside>

      <main className="content">
        {page === 'Employees' ? (
          <Employees onAdd={() => setPage('Add Employee')} />
        ) : page === 'Add Employee' ? (
          <AddEmployee />
        ) : page === 'Leave Management' ? (
          <LeaveManagement />
        ) : page === 'Attendance' ? (
          <Attendance />
        ) : page === 'Reports & Analytics' ? (
          <Reports />
        ) : page === 'Payroll' ? (
          <PayrollRuns />
        ) : page === 'Reports & Analytics' ? (
          <Reports />
        ) : page === 'Exports' ? (
          <Exports />
        ) : page === 'System' ? (
          <System />
        ) : (
          <PayrollDashboard />
        )}
      </main>
    </div>
  );
}

export default App;

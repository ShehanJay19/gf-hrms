import React from 'react';

const runs = [
  { id: 'PR-2024-10', month: 'Oct 2024', period: '01 Oct - 31 Oct', status: 'Paid', employees: '1,248', gross: '৳ 4,285,000', net: '৳ 3,842,500' },
  { id: 'PR-2024-11', month: 'Nov 2024', period: '01 Nov - 30 Nov', status: 'Pending Approval', employees: '1,252', gross: '৳ 4,310,200', net: '৳ 3,890,100' },
  { id: 'PR-2024-12', month: 'Dec 2024', period: '01 Dec - 31 Dec', status: 'Draft', employees: '--', gross: '--', net: '--' },
];

export default function PayrollRuns() {
  return (
    <div>
      <header className="topbar">
        <label className="searchbar" aria-label="Search payroll runs">
          <span className="search-icon">⌕</span>
          <input placeholder="Search payroll periods or runs..." />
        </label>

        <div className="topbar-actions">
          <button className="primary-button">Create Payroll Run</button>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="panel table-panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Payroll Runs</p>
              <p className="panel-subtitle">Manage payroll runs, approvals, and exports.</p>
            </div>
            <div className="toolbar-actions">
              <button className="secondary-button">Filter</button>
              <button className="secondary-button">Batch Export</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month/Year</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.month}</strong></td>
                    <td>{r.period}</td>
                    <td><span className={`table-status ${r.status.toLowerCase().replace(/\s+/g, '-')}`}>{r.status}</span></td>
                    <td>{r.employees}</td>
                    <td>{r.gross}</td>
                    <td><strong>{r.net}</strong></td>
                    <td>
                      <div className="action-links">
                        <button type="button">View</button>
                        <button type="button">Approve</button>
                        <button type="button">Export</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

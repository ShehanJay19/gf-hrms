import React from 'react';

const departments = [
  { name: 'Cutting', basic: 42500, ot: 8450, allowances: 3200 },
  { name: 'Sewing', basic: 162000, ot: 42100, allowances: 12500 },
  { name: 'Finishing', basic: 30400, ot: 5200, allowances: 2100 },
  { name: 'Quality Control', basic: 18000, ot: 1200, allowances: 4500 },
  { name: 'Logistics', basic: 15600, ot: 11290, allowances: 800 },
];

export default function Reports() {
  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0 }}>Reports & Analytics</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>Generate and download official garment factory documentation.</p>
          </div>
          <div>
            <button className="primary-button">Export Excel</button>
          </div>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="stats-grid">
          <article className="stat-card">
            <div className="stat-label">Total Labour Cost</div>
            <div className="stat-value">$412,850.00</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">Overtime Impact</div>
            <div className="stat-value">$68,240.00</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">Cost Per Employee</div>
            <div className="stat-value">$1,480.00</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">Budget Utilization</div>
            <div className="stat-value">92%</div>
          </article>
        </div>

        <div style={{ marginTop: 14 }} className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Departmental Cost Breakdown</p>
              <p className="panel-subtitle">Detailed cost analysis by department.</p>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>DEPT</th>
                  <th>EMPLOYEES</th>
                  <th>BASIC ($)</th>
                  <th>OT ($)</th>
                  <th>ALLOWANCES ($)</th>
                  <th>GROSS ($)</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.name}>
                    <td style={{ fontWeight: 700 }}>{d.name}</td>
                    <td>—</td>
                    <td>{d.basic.toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>{d.ot.toLocaleString()}</td>
                    <td>{d.allowances.toLocaleString()}</td>
                    <td>{(d.basic + d.ot + d.allowances).toLocaleString()}</td>
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

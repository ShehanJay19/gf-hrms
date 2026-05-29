import React from 'react';

const rows = [
  { id: '#E-3092', name: 'Arjun Sharma', dept: 'Cutting Room', checkIn: '08:02 AM', checkOut: '05:15 PM', status: 'Present', worked: '9.2 Hrs', late: '0m' },
  { id: '#E-2841', name: 'Priya Kapadia', dept: 'Quality Control', checkIn: '08:45 AM', checkOut: '--:--', status: 'Late Entry', worked: '--', late: '45m' },
  { id: '#E-4012', name: 'Rahat Malik', dept: 'Stitching A', checkIn: '--:--', checkOut: '--:--', status: 'Absent', worked: '0 Hrs', late: 'N/A' },
  { id: '#E-1988', name: 'Sana Latif', dept: 'Packing', checkIn: '--:--', checkOut: '--:--', status: 'On Leave', worked: '0 Hrs', late: 'N/A' },
  { id: '#E-5120', name: 'John Doe', dept: 'Stitching B', checkIn: '08:00 AM', checkOut: '04:00 PM', status: 'Shift End', worked: '8.0 Hrs', late: 'Normal' },
];

export default function Attendance() {
  return (
    <div>
      <header className="topbar">
        <label className="searchbar" aria-label="Search employees">
          <span className="search-icon">⌕</span>
          <input placeholder="Search employees..." />
        </label>

        <div className="topbar-actions">
          <button className="secondary-button">Mark Manual Entry</button>
          <button className="primary-button">Biometric Simulator</button>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="stats-grid">
          <article className="stat-card info">
            <div className="stat-label">Total Workforce</div>
            <div className="stat-value">1,248</div>
          </article>
          <article className="stat-card success">
            <div className="stat-label">Present Today</div>
            <div className="stat-value">1,184</div>
          </article>
          <article className="stat-card warning">
            <div className="stat-label">Absent</div>
            <div className="stat-value">42</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">On Leave</div>
            <div className="stat-value">22</div>
          </article>
        </div>

        <div style={{ marginTop: 14 }} className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Employee Records</p>
              <p className="panel-subtitle">Live update</p>
            </div>
            <div className="toolbar-actions">
              <button className="secondary-button">All Departments</button>
              <button className="secondary-button">Export</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>EMP NO</th>
                  <th>EMPLOYEE NAME</th>
                  <th>DEPT</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>STATUS</th>
                  <th>WORKED HRS</th>
                  <th>LATE/OT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 999, background: '#e6eefb', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#00386f' }}>{r.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{r.name}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{r.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.dept}</td>
                    <td>{r.checkIn}</td>
                    <td>{r.checkOut}</td>
                    <td><span className={`table-status ${r.status.toLowerCase().replace(/\s+/g, '-')}`}>{r.status}</span></td>
                    <td>{r.worked}</td>
                    <td style={{ color: r.late === 'N/A' ? '#94a3b8' : '#dc2626' }}>{r.late}</td>
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

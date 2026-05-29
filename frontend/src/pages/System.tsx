import React from 'react';

const users = [
  { username: 'john_admin', email: 'j.doe@garmentfactory.com', role: 'Super Admin', linked: 'John Doe (EMP-001)', lastLogin: '2 mins ago', status: 'Active' },
  { username: 'sarah_hrm', email: 's.miller@garmentfactory.com', role: 'Manager', linked: 'Sarah Miller (EMP-042)', lastLogin: 'Oct 24, 10:15 AM', status: 'Active' },
  { username: 'robert_ops', email: 'r.khan@garmentfactory.com', role: 'Floor Admin', linked: 'Robert Khan (EMP-115)', lastLogin: 'Oct 23, 05:45 PM', status: 'Inactive' },
  { username: 'amanda_levy', email: 'a.levy@garmentfactory.com', role: 'Manager', linked: 'Amanda Levy (EMP-088)', lastLogin: 'Oct 24, 08:00 AM', status: 'Active' },
];

export default function System() {
  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0 }}>User Management</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>Configure administrative access and security roles for the platform.</p>
          </div>
          <div>
            <button className="primary-button">Add User</button>
          </div>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="stats-grid">
          <article className="stat-card">
            <div className="stat-label">Total Admins</div>
            <div className="stat-value">24</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">Active Sessions</div>
            <div className="stat-value">08</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">Failed Logins</div>
            <div className="stat-value">03</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">System Health</div>
            <div className="stat-value">99%</div>
          </article>
        </div>

        <div style={{ marginTop: 14 }} className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">User Accounts</p>
              <p className="panel-subtitle">Configure administrative access and roles.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>LINKED EMPLOYEE</th>
                  <th>LAST LOGIN</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><strong>{u.role}</strong></td>
                    <td>{u.linked}</td>
                    <td>{u.lastLogin}</td>
                    <td><span className={`status-pill ${u.status === 'Active' ? 'success' : ''}`}>{u.status}</span></td>
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

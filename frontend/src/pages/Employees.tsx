import React from 'react';

const employees = [
  { id: '#GF-1048', name: 'Rahat Ali', dept: 'Sewing', designation: 'Senior Operator', type: 'Permanent', joined: '12 Jan 2021', salary: '৳ 18,500', status: 'Active' },
  { id: '#GF-2210', name: 'Sumaiya Akter', dept: 'Quality', designation: 'QA Analyst', type: 'Contract', joined: '05 Mar 2023', salary: '৳ 22,000', status: 'Active' },
  { id: '#GF-1842', name: 'Mohammad Karim', dept: 'Finishing', designation: 'Floor Manager', type: 'Permanent', joined: '18 Nov 2018', salary: '৳ 35,000', status: 'Active' },
  { id: '#GF-4091', name: 'Jannatul Ferdous', dept: 'Design', designation: 'Junior Designer', type: 'Trainee', joined: '01 Oct 2023', salary: '৳ 12,000', status: 'On Leave' },
];

type Props = {
  onAdd?: () => void;
};

export default function Employees({ onAdd }: Props) {
  return (
    <div>
      <header className="topbar">
        <label className="searchbar" aria-label="Search employees">
          <span className="search-icon">⌕</span>
          <input placeholder="Search employees, ID or department..." />
        </label>

        <div className="topbar-actions">
          <button className="secondary-button" onClick={() => onAdd && onAdd()}>Add New Employee</button>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="panel-header">
          <div>
            <p className="panel-title">Employees</p>
            <p className="panel-subtitle">Manage your garment factory workforce and their profiles.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>EMP NO</th>
                <th>EMPLOYEE</th>
                <th>DEPT</th>
                <th>DESIGNATION</th>
                <th>TYPE</th>
                <th>JOINED DATE</th>
                <th>BASIC SALARY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 999, background: '#e6eefb', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#00386f' }}>{e.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{e.name}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{e.name.toLowerCase().replace(' ','.')}@gf.com</div>
                      </div>
                    </div>
                  </td>
                  <td>{e.dept}</td>
                  <td>{e.designation}</td>
                  <td>{e.type}</td>
                  <td>{e.joined}</td>
                  <td>{e.salary}</td>
                  <td>
                    <span className={`status-pill ${e.status === 'Active' ? 'success' : 'warning'}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

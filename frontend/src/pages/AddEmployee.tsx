import React from 'react';

export default function AddEmployee() {
  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0 }}>Add New Employee</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Fill in the details below to enroll a new worker into the system.</p>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="panel">
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div>
              <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', background: '#fff' }}>
                <div style={{ width: '100%', height: 220, border: '2px dashed #e6eefb', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#64748b' }}>
                  EMPLOYEE IMAGE
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Employee Number</label>
                  <input style={{ width: '100%', height: 40, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} defaultValue="EMP-2024-0892" />
                </div>
              </div>
            </div>

            <div>
              <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', background: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>First Name</label>
                    <input style={{ width: '100%', height: 40, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Last Name</label>
                    <input style={{ width: '100%', height: 40, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Date of Birth</label>
                    <input type="date" style={{ width: '100%', height: 40, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Marital Status</label>
                    <select style={{ width: '100%', height: 40, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <option>Select Status</option>
                      <option>Single</option>
                      <option>Married</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Gender</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label><input type="radio" name="g" /> Male</label>
                    <label><input type="radio" name="g" /> Female</label>
                    <label><input type="radio" name="g" /> Other</label>
                  </div>
                </div>

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="secondary-button">Cancel</button>
                  <button className="primary-button">Save Employee</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

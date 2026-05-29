import React from 'react';

const requests = [
  { id: 'REQ-1024', name: 'Rahim Uddin', type: 'Sick Leave', duration: 'Oct 12 — Oct 14', days: 3, note: 'Suffering from viral fever. Doctor advised complete bed rest.' },
  { id: 'REQ-2051', name: 'Farhana Yasmin', type: 'Annual Leave', duration: 'Oct 20 — Oct 25', days: 6, note: 'Personal family matters requiring presence.' },
  { id: 'REQ-0892', name: 'Anwar Hossain', type: 'Casual Leave', duration: 'Oct 15', days: 1, note: 'Urgent administrative work at child\'s school.' },
];

export default function LeaveManagement() {
  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0 }}>Leave Management</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>Pending Approvals</p>
          </div>
          <div>
            <button className="primary-button">New Request</button>
          </div>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <div className="panel-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {requests.map((r) => (
            <article key={r.id} className="panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e6eefb', display: 'grid', placeItems: 'center', color: '#00386f', fontWeight: 800 }}>{r.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                <div>
                  <div style={{ fontWeight: 800 }}>{r.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{r.type}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fbfbfe' }}>
                <div style={{ fontWeight: 800 }}>{r.duration}</div>
                <div style={{ color: '#64748b', marginTop: 6 }}>Total Days — {r.days} Days</div>
              </div>

              <blockquote style={{ marginTop: 12, color: '#475569', fontStyle: 'italic' }}>
                {`"${r.note}"`}
              </blockquote>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button style={{ background: '#dc2626', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Reject</button>
                <button style={{ background: '#16a34a', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Approve</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

import { fetchJson } from '../lib/api';
import { downloadApiFile } from '../lib/download';

const recent = [
  { name: 'Payroll_Mar24_Final.xlsx', type: 'EXCEL', by: 'Admin (A. De Silva)', date: 'Today, 10:45 AM' },
  { name: 'EPF_Monthly_Submission_Feb.xlsx', type: 'EXCEL', by: 'System (Auto)', date: 'Mar 12, 09:00 AM' },
  { name: 'Payslips_Sewing_A_Mar24.pdf', type: 'PDF', by: 'Admin (A. De Silva)', date: 'Mar 11, 04:30 PM' },
];

export default function Exports() {
  const [payrollRunId, setPayrollRunId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attendanceYear = new Date().getFullYear();
  const attendanceMonth = new Date().getMonth() + 1;
  const payslipRunId = payrollRunId;
  const payslipEmployeeId = 1;

  useEffect(() => {
    let active = true;

    const loadLatestRun = async () => {
      try {
        const runs = await fetchJson<Array<{ id: number }>>('/payroll/runs');
        if (active) {
          setPayrollRunId(runs[0]?.id ?? null);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load payroll runs.');
        }
      }
    };

    void loadLatestRun();

    return () => {
      active = false;
    };
  }, []);

  const handleDownload = async (downloadTask: () => Promise<void>) => {
    try {
      await downloadTask();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download file.';
      window.alert(message);
    }
  };

  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <h2 style={{ margin: 0 }}>Data Export Center</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>Generate and download official garment factory documentation.</p>
          </div>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <article className="panel">
            <h3>Payroll Register Excel</h3>
            <p>Full breakdown of monthly salaries and deductions.</p>
            <div style={{ marginTop: 12 }}>
              <select style={{ height: 40, padding: 8, borderRadius: 8 }}>
                <option>March 2024 - Final Run</option>
              </select>
              <div style={{ marginTop: 12 }}>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => payrollRunId === null ? window.alert('No payroll run available yet.') : handleDownload(() => downloadApiFile(`/exports/payroll/${payrollRunId}/excel`, `payroll_register_${payrollRunId}.xlsx`))}
                >
                  Download Register
                </button>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3>EPF/ETF Report Excel</h3>
            <p>Mandatory statutory contribution compliance report.</p>
            <div style={{ marginTop: 12 }}>
              <select style={{ height: 40, padding: 8, borderRadius: 8 }}>
                <option>Current Month (March 2024)</option>
              </select>
              <div style={{ marginTop: 12 }}>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => payrollRunId === null ? window.alert('No payroll run available yet.') : handleDownload(() => downloadApiFile(`/exports/payroll/${payrollRunId}/epf-excel`, `epf_etf_report_${payrollRunId}.xlsx`))}
                >
                  Download Statutory Report
                </button>
              </div>
            </div>
          </article>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <article className="panel">
            <h3>Attendance Report Excel</h3>
            <p>Floor worker clock-in/out and OT summary.</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <select style={{ height: 40, padding: 8, borderRadius: 8 }}>
                <option>March</option>
              </select>
              <select style={{ height: 40, padding: 8, borderRadius: 8 }}>
                <option>2024</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="primary-button"
                type="button"
                onClick={() => handleDownload(() => downloadApiFile(`/exports/attendance/${attendanceYear}/${attendanceMonth}/excel`, `attendance_${attendanceYear}_${attendanceMonth}.xlsx`))}
              >
                Generate Attendance Export
              </button>
            </div>
          </article>

          <article className="panel">
            <h3>Employee Payslip PDF</h3>
            <p>Bulk or individual payslip generation.</p>
            <div style={{ marginTop: 12 }}>
              <input placeholder="Search employee or department" style={{ width: '100%', height: 40, padding: 8, borderRadius: 8 }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => payslipRunId === null ? window.alert('No payroll run available yet.') : handleDownload(() => downloadApiFile(`/exports/payslip/${payslipRunId}/${payslipEmployeeId}/pdf`, `payslip_${payslipRunId}_${payslipEmployeeId}.pdf`))}
                >
                  Batch PDF
                </button>
              </div>
            </div>
          </article>
        </div>

        <div style={{ marginTop: 18 }} className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Recent Activity Log</p>
              <p className="panel-subtitle">Recently generated exports</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FILE NAME</th>
                  <th>TYPE</th>
                  <th>GENERATED BY</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td style={{ color: '#2563eb', fontWeight: 700 }}>{r.type}</td>
                    <td>{r.by}</td>
                    <td>{r.date}</td>
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => payrollRunId === null ? window.alert('No payroll run available yet.') : handleDownload(() => downloadApiFile(`/exports/payroll/${payrollRunId}/excel`, `payroll_register_${payrollRunId}.xlsx`))}
                      >
                        Download
                      </button>
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

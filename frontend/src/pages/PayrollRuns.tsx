import React, { useEffect, useMemo, useState } from 'react';

import { fetchJson } from '../lib/api';
import { downloadApiFile } from '../lib/download';

type PayrollRun = {
  id: number;
  month: number;
  year: number;
  period_start: string;
  period_end: string;
  status: string;
  notes?: string | null;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value);
}

export default function PayrollRuns() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRuns = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJson<PayrollRun[]>('/payroll/runs');
        if (active) {
          setRuns(data);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load payroll runs.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRuns();

    return () => {
      active = false;
    };
  }, []);

  const sortedRuns = useMemo(() => [...runs].sort((left, right) => right.year - left.year || right.month - left.month), [runs]);

  const handleDownload = async (runId: number) => {
    try {
      await downloadApiFile(`/exports/payroll/${runId}/excel`, `payroll_register_${runId}.xlsx`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download file.';
      window.alert(message);
    }
  };

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
              <button className="secondary-button" type="button" onClick={() => handleDownload(sortedRuns[0]?.id ?? 1)}>Batch Export</button>
            </div>
          </div>

          {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}

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
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading payroll runs...</td>
                  </tr>
                ) : sortedRuns.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No payroll runs found.</td>
                  </tr>
                ) : (
                  sortedRuns.map((run) => (
                    <tr key={run.id}>
                      <td><strong>{MONTH_NAMES[run.month - 1]} {run.year}</strong></td>
                      <td>{new Date(run.period_start).toLocaleDateString()} – {new Date(run.period_end).toLocaleDateString()}</td>
                      <td><span className={`table-status ${run.status.toLowerCase().replace(/\s+/g, '-')}`}>{run.status}</span></td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>
                        <div className="action-links">
                          <button type="button">View</button>
                          <button type="button">Approve</button>
                          <button type="button" onClick={() => handleDownload(run.id)}>Export</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

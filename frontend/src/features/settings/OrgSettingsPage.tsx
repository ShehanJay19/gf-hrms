import { useCallback, useState, type FormEvent } from 'react';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import {
  createDepartment,
  createDesignation,
  createSection,
  listDepartments,
  listDesignations,
  listSections,
} from '../../lib/api/employees';
import { createShift, listShifts } from '../../lib/api/attendance';

export default function OrgSettingsPage() {
  return (
    <div>
      <PageHeader title="Org Settings" subtitle="Departments, sections, designations, and shifts used across the system." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DepartmentsPanel />
        <SectionsPanel />
        <DesignationsPanel />
        <ShiftsPanel />
      </div>
    </div>
  );
}

function DepartmentsPanel() {
  const fetcher = useCallback(() => listDepartments(), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const mutation = useApiMutation(createDepartment);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({ name, code });
    setName('');
    setCode('');
    refetch();
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Departments</p>
        </div>
      </div>
      {loading && <Skeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {data.map((dept) => (
                <tr key={dept.id}>
                  <td className="cell-primary">{dept.name}</td>
                  <td>{dept.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Code</label>
          <input className="input" value={code} onChange={(event) => setCode(event.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
          Add Department
        </button>
      </form>
      {mutation.error && <div className="auth-error" style={{ marginTop: 8 }}>{mutation.error}</div>}
    </section>
  );
}

function SectionsPanel() {
  const fetchDepts = useCallback(() => listDepartments(), []);
  const { data: departments } = useApiQuery(fetchDepts, []);
  const fetcher = useCallback(() => listSections(), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const mutation = useApiMutation(createSection);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({ name, code, department_id: Number(departmentId) });
    setName('');
    setCode('');
    refetch();
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Sections</p>
        </div>
      </div>
      {loading && <Skeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Department ID</th>
              </tr>
            </thead>
            <tbody>
              {data.map((section) => (
                <tr key={section.id}>
                  <td className="cell-primary">{section.name}</td>
                  <td>{section.code}</td>
                  <td>{section.department_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Code</label>
          <input className="input" value={code} onChange={(event) => setCode(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Department</label>
          <select className="input" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required>
            <option value="">Select department</option>
            {(departments ?? []).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
          Add Section
        </button>
      </form>
      {mutation.error && <div className="auth-error" style={{ marginTop: 8 }}>{mutation.error}</div>}
    </section>
  );
}

function DesignationsPanel() {
  const fetcher = useCallback(() => listDesignations(), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const mutation = useApiMutation(createDesignation);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({ name, grade: grade || undefined });
    setName('');
    setGrade('');
    refetch();
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Designations</p>
        </div>
      </div>
      {loading && <Skeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.map((designation) => (
                <tr key={designation.id}>
                  <td className="cell-primary">{designation.name}</td>
                  <td>{designation.grade ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Grade</label>
          <input className="input" value={grade} onChange={(event) => setGrade(event.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
          Add Designation
        </button>
      </form>
      {mutation.error && <div className="auth-error" style={{ marginTop: 8 }}>{mutation.error}</div>}
    </section>
  );
}

function ShiftsPanel() {
  const fetcher = useCallback(() => listShifts(), []);
  const { data, loading, error, refetch } = useApiQuery(fetcher, []);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const mutation = useApiMutation(createShift);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await mutation.mutate({ name, code, start_time: startTime, end_time: endTime });
    setName('');
    setCode('');
    refetch();
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-title">Shifts</p>
        </div>
      </div>
      {loading && <Skeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && (
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {data.map((shift) => (
                <tr key={shift.id}>
                  <td className="cell-primary">{shift.name}</td>
                  <td>{shift.code}</td>
                  <td>{shift.start_time}</td>
                  <td>{shift.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Code</label>
          <input className="input" value={code} onChange={(event) => setCode(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Start Time</label>
          <input className="input" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">End Time</label>
          <input className="input" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
          Add Shift
        </button>
      </form>
      {mutation.error && <div className="auth-error" style={{ marginTop: 8 }}>{mutation.error}</div>}
    </section>
  );
}

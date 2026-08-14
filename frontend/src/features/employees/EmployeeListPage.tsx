import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useAuth } from '../../app/AuthContext';
import { hasRole, HR_MANAGER_ROLES } from '../../lib/roles';
import {
  getHeadcountSummary,
  listDepartments,
  listEmployees,
  type Department,
  type EmploymentType,
} from '../../lib/api/employees';

const PAGE_SIZE = 20;

const EMPLOYMENT_TYPES: EmploymentType[] = ['permanent', 'contract', 'casual', 'trainee'];

export default function EmployeeListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canManage = hasRole(user?.role, HR_MANAGER_ROLES);

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [page, setPage] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    listDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  const fetchEmployees = useCallback(
    () =>
      listEmployees({
        search: search || undefined,
        department_id: departmentId || undefined,
        employment_type: employmentType || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    [search, departmentId, employmentType, page],
  );
  const { data, loading, error, refetch } = useApiQuery(fetchEmployees, [search, departmentId, employmentType, page]);

  const fetchHeadcount = useCallback(() => getHeadcountSummary(), []);
  const { data: headcount } = useApiQuery(fetchHeadcount, []);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your garment factory workforce and their profiles."
        actions={
          canManage && (
            <Link to="/employees/new" className="btn btn-primary">
              + Add New Employee
            </Link>
          )
        }
      />

      {headcount && (
        <section className="stats-grid">
          <StatCard label="Total Active" value={String(headcount.total_active)} tone="info" />
          <StatCard label="Permanent" value={String(headcount.by_type.permanent ?? 0)} />
          <StatCard label="Contract" value={String(headcount.by_type.contract ?? 0)} />
          <StatCard label="Casual" value={String(headcount.by_type.casual ?? 0)} />
          <StatCard label="Trainee" value={String(headcount.by_type.trainee ?? 0)} />
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-title">Employee Directory</p>
            <p className="panel-subtitle">{data ? `${data.total} employee(s) found` : 'Loading…'}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label className="searchbar" aria-label="Search employees">
              <span className="search-icon">
                <Icon name="search" size={15} />
              </span>
              <input
                placeholder="Search by name, ID, or NIC..."
                value={search}
                onChange={(event) => {
                  setPage(0);
                  setSearch(event.target.value);
                }}
              />
            </label>
            <select
              className="input"
              style={{ width: 180 }}
              value={departmentId}
              onChange={(event) => {
                setPage(0);
                setDepartmentId(event.target.value ? Number(event.target.value) : '');
              }}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              style={{ width: 160 }}
              value={employmentType}
              onChange={(event) => {
                setPage(0);
                setEmploymentType(event.target.value as EmploymentType | '');
              }}
            >
              <option value="">All Types</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <Skeleton rows={6} />}
        {error && <ErrorState message={error} onRetry={refetch} />}

        {data && data.employees.length === 0 && (
          <EmptyState title="No employees found" body="Try adjusting your filters, or add a new employee." />
        )}

        {data && data.employees.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Emp No</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th>Joined</th>
                    <th>Basic Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => navigate(`/employees/${employee.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{employee.employee_no}</td>
                      <td>
                        <div className="cell-person">
                          <Avatar name={employee.full_name} />
                          <div>
                            <div className="cell-primary">{employee.full_name}</div>
                            <div className="cell-secondary">{employee.nic}</div>
                          </div>
                        </div>
                      </td>
                      <td>{employee.department?.name ?? '—'}</td>
                      <td>{employee.designation?.name ?? '—'}</td>
                      <td>{employee.employment_type}</td>
                      <td>{new Date(employee.joined_date).toLocaleDateString()}</td>
                      <td>৳ {Number(employee.basic_salary).toLocaleString()}</td>
                      <td>
                        <StatusPill status={employee.is_active ? 'active' : 'inactive'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="cell-secondary" style={{ alignSelf: 'center' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

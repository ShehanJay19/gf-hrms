import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatusPill from '../../components/StatusPill';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useAuth } from '../../app/AuthContext';
import { hasRole, roleLabel, HR_MANAGER_ROLES } from '../../lib/roles';
import { getCurrentUser } from '../../lib/api/auth';

export default function AccountPage() {
  const { user } = useAuth();
  const canCreateUsers = hasRole(user?.role, HR_MANAGER_ROLES);

  const fetchMe = useCallback(() => getCurrentUser(), []);
  const { data, loading, error, refetch } = useApiQuery(fetchMe, []);

  return (
    <div>
      <PageHeader
        title="Account"
        subtitle="Your profile and access details."
        actions={
          canCreateUsers && (
            <Link to="/account/users/new" className="btn btn-primary">
              + Create User
            </Link>
          )
        }
      />

      {loading && <Skeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {data && (
        <section className="form-section" style={{ maxWidth: 520 }}>
          <div className="form-section-title">Profile</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: 0 }}>
            <div>
              <div className="field-label">Username</div>
              <div className="cell-primary">{data.username}</div>
            </div>
            <div>
              <div className="field-label">Email</div>
              <div className="cell-primary">{data.email}</div>
            </div>
            <div>
              <div className="field-label">Role</div>
              <div className="cell-primary">{roleLabel(data.role)}</div>
            </div>
            <div>
              <div className="field-label">Status</div>
              <StatusPill status={data.is_active ? 'active' : 'inactive'} />
            </div>
            <div>
              <div className="field-label">Linked Employee</div>
              <div className="cell-primary">{data.employee_id ? `Employee #${data.employee_id}` : 'Not linked'}</div>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

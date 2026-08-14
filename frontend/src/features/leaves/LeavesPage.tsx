import { useCallback, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../lib/hooks/useApiQuery';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { useAuth } from '../../app/AuthContext';
import { hasRole, SUPERVISOR_ROLES } from '../../lib/roles';
import { approveLeave, listPendingLeaves, type LeaveRequest } from '../../lib/api/attendance';
import RejectLeaveModal from './RejectLeaveModal';
import NewLeaveRequestForm from './NewLeaveRequestForm';

export default function LeavesPage() {
  const { user } = useAuth();
  const canApprove = hasRole(user?.role, SUPERVISOR_ROLES);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);

  const fetchPending = useCallback(() => listPendingLeaves(), []);
  const { data, loading, error, refetch } = useApiQuery(fetchPending, []);

  const approveMutation = useApiMutation((leaveId: number) => approveLeave(leaveId, { status: 'approved' }));
  const rejectMutation = useApiMutation((leaveId: number, reason: string) =>
    approveLeave(leaveId, { status: 'rejected', reject_reason: reason }),
  );

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Review pending requests and submit new leave applications." />

      {canApprove && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <div>
              <p className="panel-title">Pending Approvals</p>
              <p className="panel-subtitle">Requests waiting on your decision.</p>
            </div>
          </div>

          {loading && <Skeleton rows={3} />}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {data && data.length === 0 && <EmptyState title="No pending leave requests" icon="✅" />}

          {data && data.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {data.map((leave) => (
                <article key={leave.id} className="panel">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar name={`Employee ${leave.employee_id}`} />
                    <div>
                      <div className="cell-primary">Employee #{leave.employee_id}</div>
                      <div className="cell-secondary">{leave.leave_type}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--color-ink-50)' }}>
                    <div className="cell-primary">
                      {new Date(leave.start_date).toLocaleDateString()} – {new Date(leave.end_date).toLocaleDateString()}
                    </div>
                    <div className="cell-secondary">Total — {leave.total_days} day(s)</div>
                  </div>

                  {leave.reason && <p style={{ marginTop: 12, fontStyle: 'italic', color: 'var(--color-ink-700)' }}>"{leave.reason}"</p>}

                  <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setRejectingLeave(leave)}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={approveMutation.loading}
                      onClick={async () => {
                        await approveMutation.mutate(leave.id);
                        refetch();
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <NewLeaveRequestForm onSubmitted={refetch} />

      {rejectingLeave && (
        <RejectLeaveModal
          loading={rejectMutation.loading}
          onClose={() => setRejectingLeave(null)}
          onConfirm={async (reason) => {
            await rejectMutation.mutate(rejectingLeave.id, reason);
            setRejectingLeave(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

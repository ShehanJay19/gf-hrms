import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useApiMutation } from '../../lib/hooks/useApiMutation';
import { registerUser } from '../../lib/api/auth';
import { ALL_ROLES, roleLabel, type UserRole } from '../../lib/roles';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const mutation = useApiMutation(registerUser);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await mutation.mutate({ email, username, password, role });
    setCreatedUsername(created.username);
    setEmail('');
    setUsername('');
    setPassword('');
    setRole('employee');
  };

  return (
    <div>
      <PageHeader title="Create User" subtitle="Grant system access to a staff member." />

      {createdUsername && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span>✅</span>
          <span>
            User <strong>{createdUsername}</strong> was created. There's no user directory yet in this system — share their
            credentials directly.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-section" style={{ maxWidth: 480 }}>
        <div className="field">
          <label className="field-label">Email</label>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Username</label>
          <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </div>
        <div className="field">
          <label className="field-label">Temporary Password</label>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </div>
        <div className="field">
          <label className="field-label">Role</label>
          <select className="input" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>

        {mutation.error && <div className="auth-error">{mutation.error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.loading}>
            {mutation.loading ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}

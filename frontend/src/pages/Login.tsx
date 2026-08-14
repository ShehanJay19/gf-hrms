import React, { useState } from 'react';

import { getApiBaseUrl, storeAuthSession } from '../lib/api';

type LoginProps = {
  onLogin: () => void;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  role: string;
  username: string;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@garmentfactory.com');
  const [password, setPassword] = useState('Admin@2025!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(payload?.detail || 'Invalid login credentials.');
      }

      const data = await response.json() as LoginResponse;
      storeAuthSession(data.access_token, {
        username: data.username,
        role: data.role,
        email,
      });
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-badge">GF-HRMS</div>
          <h1>Factory management with one secure sign-in.</h1>
          <p>Log in as superadmin to manage payroll, attendance, employees, and system settings.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="auth-hint">
            Superadmin: <strong>admin@garmentfactory.com</strong>
          </div>
        </form>
      </div>
    </div>
  );
}

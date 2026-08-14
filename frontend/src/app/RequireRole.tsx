import { Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasRole, type UserRole } from '../lib/roles';
import Forbidden from '../components/Forbidden';

export default function RequireRole({ allow }: { allow: UserRole[] }) {
  const { user } = useAuth();

  if (!hasRole(user?.role, allow)) {
    return <Forbidden />;
  }

  return <Outlet />;
}

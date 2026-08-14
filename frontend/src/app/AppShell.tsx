import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasRole, roleLabel, HR_MANAGER_ROLES, type UserRole } from '../lib/roles';

type NavItem = {
  to: string;
  label: string;
  icon: string;
  allow?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/employees', label: 'Employees', icon: '\u{1F465}' },
  { to: '/attendance', label: 'Attendance', icon: '\u{1F553}' },
  { to: '/leaves', label: 'Leaves', icon: '\u{1F4C4}' },
  { to: '/payroll/runs', label: 'Payroll', icon: '\u{1F4B0}' },
  { to: '/reports', label: 'Reports', icon: '\u{1F4CA}', allow: HR_MANAGER_ROLES },
  { to: '/exports', label: 'Exports', icon: '⬇' },
  { to: '/settings', label: 'Org Settings', icon: '⚙', allow: HR_MANAGER_ROLES },
  { to: '/account', label: 'Account', icon: '\u{1F464}' },
];

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GF</div>
          <div>
            <div className="brand-name">GF-HRMS</div>
            <div className="brand-subtitle">Garment Factory HR</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {NAV_ITEMS.filter((item) => !item.allow || hasRole(user?.role, item.allow)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{initials(user?.username || '?')}</div>
          <div>
            <div className="sidebar-footer-name">{user?.username}</div>
            <div className="sidebar-footer-role">{roleLabel(user?.role)}</div>
          </div>
          <button className="logout-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

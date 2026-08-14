import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasRole, roleLabel, HR_MANAGER_ROLES, SUPERVISOR_ROLES, type UserRole } from '../lib/roles';
import Icon from '../components/Icon';
import { listPendingLeaves } from '../lib/api/attendance';

type NavItem = {
  to: string;
  label: string;
  icon: string;
  allow?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/employees', label: 'Employees', icon: 'users' },
  { to: '/attendance', label: 'Attendance', icon: 'calendar' },
  { to: '/leaves', label: 'Leaves', icon: 'leave' },
  { to: '/payroll/runs', label: 'Payroll', icon: 'dollar', allow: HR_MANAGER_ROLES },
  { to: '/reports', label: 'Reports', icon: 'chart', allow: HR_MANAGER_ROLES },
  { to: '/exports', label: 'Exports', icon: 'download' },
  { to: '/settings', label: 'Org Settings', icon: 'building', allow: HR_MANAGER_ROLES },
  { to: '/account', label: 'Account', icon: 'users' },
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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);

  const canSeePending = hasRole(user?.role, SUPERVISOR_ROLES);

  const refreshPending = useCallback(() => {
    if (!canSeePending) return;
    listPendingLeaves()
      .then((leaves) => setPendingLeaves(leaves.length))
      .catch(() => setPendingLeaves(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeePending]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!search.trim()) return;
    navigate(`/employees?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  const visibleNav = NAV_ITEMS.filter((item) => !item.allow || hasRole(user?.role, item.allow));

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="scrim" onClick={() => setMobileOpen(false)} />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
              <path d="M4 4l4 3-2 3 4 3-2 3 4 4" />
              <path d="M20 4l-4 3 2 3-4 3 2 3-4 4" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">GF-HRMS</div>
            <div className="brand-subtitle">Garment Factory HR</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} size={18} className="nav-icon" />
              <span className="label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="collapse-btn" type="button" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse sidebar">
            <Icon name="chevronLeft" size={16} />
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="topbar-menu-btn" type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" size={18} />
          </button>

          <form className="search-field" onSubmit={handleSearch}>
            <Icon name="search" size={16} />
            <input
              type="text"
              placeholder="Search employees, ID, or NIC..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search employees"
            />
          </form>

          <div className="topbar-spacer" />

          {canSeePending && (
            <button
              className="icon-button"
              type="button"
              aria-label="Pending leave requests"
              onClick={() => (pendingLeaves ? navigate('/leaves') : refreshPending())}
            >
              <Icon name="bell" size={17} />
              {Boolean(pendingLeaves) && <span className="notif-dot" />}
            </button>
          )}

          <div className="user-chip">
            <div className="avatar">{initials(user?.username || '?')}</div>
            <div className="user-chip-text">
              <div className="user-chip-name">{user?.username}</div>
              <div className="user-chip-role">{roleLabel(user?.role)}</div>
            </div>
            <button className="logout-button" type="button" onClick={logout} title="Log out">
              <Icon name="login" size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

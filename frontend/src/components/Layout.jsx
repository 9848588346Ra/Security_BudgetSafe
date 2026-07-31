import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Budget<span>Safe</span>
        </div>
        {user?.role === 'admin' ? (
          <>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/admin">
              Admin overview
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/admin/users">
              Users
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/admin/flags">
              Flagged txs
            </NavLink>
          </>
        ) : (
          <>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/" end>
              Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/transactions">
              Transactions
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/budgets">
              Budgets
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/alerts">
              Alerts
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/profile">
              Profile
            </NavLink>
          </>
        )}
        <div style={{ marginTop: 'auto' }}>
          <p className="muted" style={{ margin: '0 0 0.5rem', padding: '0 0.6rem' }}>
            {user?.displayName}
          </p>
          <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

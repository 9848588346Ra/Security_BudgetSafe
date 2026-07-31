import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/stats')
      .then((d) => setStats(d.stats))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Admin overview</h1>
          <p>Platform statistics</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {stats && (
        <div className="grid-3">
          <div className="stat">
            <span className="muted">Users</span>
            <strong>{stats.users}</strong>
          </div>
          <div className="stat">
            <span className="muted">Disabled</span>
            <strong>{stats.disabledAccounts}</strong>
          </div>
          <div className="stat">
            <span className="muted">Open flags</span>
            <strong>{stats.openFlags}</strong>
          </div>
        </div>
      )}
    </>
  );
}

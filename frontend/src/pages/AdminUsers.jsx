import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const data = await api('/admin/users');
    setUsers(data.users || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const toggle = async (user) => {
    await api(`/admin/users/${user.id}/disable`, {
      method: 'PATCH',
      body: {
        disabled: !user.isDisabled,
        reason: user.isDisabled ? '' : 'Disabled by admin review',
      },
    });
    await load();
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Users</h1>
          <p>Enable or disable accounts</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>MFA</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}</td>
                <td>{u.email}</td>
                <td>{u.mfaEnabled ? 'Yes' : 'No'}</td>
                <td>
                  <span className={`badge ${u.isDisabled ? 'danger' : 'ok'}`}>
                    {u.isDisabled ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn ${u.isDisabled ? 'secondary' : 'danger'}`}
                    onClick={() => toggle(u)}
                  >
                    {u.isDisabled ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

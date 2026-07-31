import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const data = await api('/alerts');
    setAlerts(data.alerts || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const markRead = async (id) => {
    await api(`/alerts/${id}/read`, { method: 'POST' });
    await load();
  };

  const markAll = async () => {
    await api('/alerts/read-all', { method: 'POST' });
    await load();
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Alerts</h1>
          <p>Budget and anomaly notifications</p>
        </div>
        <button type="button" className="btn secondary" onClick={markAll}>
          Mark all read
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="panel">
        {alerts.length === 0 ? (
          <div className="empty">No alerts.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Message</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${a.type === 'anomaly' ? 'danger' : 'warn'}`}>
                      {a.type}
                    </span>
                  </td>
                  <td>{a.message}</td>
                  <td>{a.read ? 'Read' : 'Unread'}</td>
                  <td>
                    {!a.read && (
                      <button type="button" className="btn secondary" onClick={() => markRead(a.id)}>
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

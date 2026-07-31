import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminFlags() {
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const data = await api('/admin/flagged');
    setFlags(data.flagged || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const review = async (id) => {
    await api(`/admin/flagged/${id}/review`, {
      method: 'POST',
      body: { note: 'Reviewed — no further action' },
    });
    await load();
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Flagged transactions</h1>
          <p>Review flagged transactions</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <section className="panel">
        {flags.length === 0 ? (
          <div className="empty">No flagged transactions.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id}>
                  <td>{f.userDisplayName || f.userEmail}</td>
                  <td>{f.category}</td>
                  <td>{f.amount.toFixed(2)}</td>
                  <td>{f.anomalyReason}</td>
                  <td>
                    <span className={`badge ${f.anomalyReviewed ? 'ok' : 'warn'}`}>
                      {f.anomalyReviewed ? 'Reviewed' : 'Open'}
                    </span>
                  </td>
                  <td>
                    {!f.anomalyReviewed && (
                      <button type="button" className="btn" onClick={() => review(f.id)}>
                        Mark reviewed
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

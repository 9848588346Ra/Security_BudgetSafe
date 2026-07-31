import { useEffect, useState } from 'react';
import { api } from '../api';

const empty = {
  type: 'expense',
  amount: '',
  category: 'Groceries',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  confirmed: false,
};

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const data = await api('/transactions');
    setItems(data.transactions || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
      };
      if (editing) {
        await api(`/transactions/${editing}`, {
          method: 'PATCH',
          body: {
            amount: payload.amount,
            category: payload.category,
            description: payload.description,
            date: payload.date,
          },
        });
        setMessage('Transaction updated');
      } else {
        const data = await api('/transactions', { method: 'POST', body: payload });
        if (data.transaction?.anomalyFlagged) {
          setMessage(`Saved — anomaly flagged: ${data.transaction.anomalyReason}`);
        } else {
          setMessage('Transaction saved');
        }
      }
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmTx = async (id) => {
    await api(`/transactions/${id}/confirm`, { method: 'POST' });
    await load();
  };

  const removeTx = async (id) => {
    await api(`/transactions/${id}`, { method: 'DELETE' });
    await load();
  };

  const startEdit = (tx) => {
    setEditing(tx.id);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description,
      date: tx.date.slice(0, 10),
      confirmed: tx.confirmed,
    });
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Transactions</h1>
          <p>Add and manage transactions</p>
        </div>
      </div>

      <section className="panel">
        <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="grid-2">
            <label>
              Type
              <select
                value={form.type}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
          </div>
          <div className="grid-2">
            <label>
              Category
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label>
              Date
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          {!editing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
              />
              Confirm now (locks record)
            </label>
          )}
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <div className="row-actions">
            <button className="btn" type="submit">
              {editing ? 'Update' : 'Save'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>All transactions</h2>
        {items.length === 0 ? (
          <div className="empty">No transactions yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.category}</td>
                  <td>{tx.amount.toFixed(2)}</td>
                  <td>{tx.description}</td>
                  <td>
                    {tx.confirmed && <span className="badge ok">Confirmed</span>}{' '}
                    {tx.anomalyFlagged && <span className="badge danger">Anomaly</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      {!tx.confirmed && (
                        <>
                          <button type="button" className="btn secondary" onClick={() => startEdit(tx)}>
                            Edit
                          </button>
                          <button type="button" className="btn" onClick={() => confirmTx(tx.id)}>
                            Confirm
                          </button>
                          <button type="button" className="btn danger" onClick={() => removeTx(tx.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
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

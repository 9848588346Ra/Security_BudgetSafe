import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export default function Budgets() {
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    category: '',
    monthlyLimit: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    const data = await api(`/budgets?month=${form.month}&year=${form.year}`);
    setBudgets(data.budgets || []);
  }, [form.month, form.year]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api('/budgets', {
        method: 'PUT',
        body: {
          category: form.category,
          monthlyLimit: Number(form.monthlyLimit),
          month: Number(form.month),
          year: Number(form.year),
        },
      });
      setOk('Budget saved');
      setForm({ ...form, category: '', monthlyLimit: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api(`/budgets/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Budgets</h1>
          <p>Monthly limits by category</p>
        </div>
      </div>

      <section className="panel">
        <form className="form" onSubmit={onSubmit}>
          <div className="grid-3">
            <label>
              Category
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label>
              Monthly limit
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
              />
            </label>
            <label>
              Month / Year
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
                <input
                  type="number"
                  min="2000"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          {ok && <div className="success">{ok}</div>}
          <button className="btn" type="submit">
            Save budget
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Active budgets</h2>
        {budgets.length === 0 ? (
          <div className="empty">No budgets for this month.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Limit</th>
                <th>Spent</th>
                <th>Progress</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td>{b.category}</td>
                  <td>{b.monthlyLimit.toFixed(2)}</td>
                  <td>{b.spent.toFixed(2)}</td>
                  <td style={{ minWidth: 140 }}>
                    <div className="progress">
                      <span style={{ width: `${b.progressPct}%` }} />
                    </div>
                    <span className="muted">{b.progressPct}%</span>
                  </td>
                  <td>
                    <button type="button" className="btn danger" onClick={() => remove(b.id)}>
                      Delete
                    </button>
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

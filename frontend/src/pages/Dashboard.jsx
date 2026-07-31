import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([api('/transactions/summary'), api('/budgets')]);
        setSummary(s);
        setBudgets(b.budgets || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const chartData = summary
    ? Object.entries(summary.byCategory || {}).map(([category, total]) => ({ category, total }))
    : [];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Monthly summary for {user?.displayName}</p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {summary && (
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div className="stat">
            <span className="muted">Income</span>
            <strong>
              {user?.currency} {summary.income.toFixed(2)}
            </strong>
          </div>
          <div className="stat">
            <span className="muted">Expenses</span>
            <strong>
              {user?.currency} {summary.expense.toFixed(2)}
            </strong>
          </div>
          <div className="stat">
            <span className="muted">Balance</span>
            <strong>
              {user?.currency} {summary.balance.toFixed(2)}
            </strong>
          </div>
        </div>
      )}

      <div className="grid-2">
        <section className="panel">
          <h2>Spending by category</h2>
          {chartData.length === 0 ? (
            <div className="empty">No expenses this month yet.</div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="category" stroke="#9bb8ae" />
                  <YAxis stroke="#9bb8ae" />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3dd6c6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Budget progress</h2>
          {budgets.length === 0 ? (
            <div className="empty">Set category budgets to track limits.</div>
          ) : (
            budgets.map((b) => (
              <div key={b.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{b.category}</strong>
                  <span className="muted">
                    {b.spent.toFixed(0)} / {b.monthlyLimit.toFixed(0)}
                  </span>
                </div>
                <div className="progress" style={{ marginTop: '0.4rem' }}>
                  <span style={{ width: `${b.progressPct}%` }} />
                </div>
                {b.progressPct >= 80 && (
                  <span className={`badge ${b.overBudget ? 'danger' : 'warn'}`}>
                    {b.overBudget ? 'Over budget' : 'Near limit'}
                  </span>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

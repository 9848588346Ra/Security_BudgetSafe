import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import CaptchaField from '../components/CaptchaField';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', totp: '', captcha: '' });
  const [captchaKey, setCaptchaKey] = useState(0);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const refreshCaptcha = () => {
    setForm((f) => ({ ...f, captcha: '' }));
    setCaptchaKey((k) => k + 1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(form);
      if (data.mfaRequired) {
        setMfaRequired(true);
        refreshCaptcha();
        return;
      }
      navigate(data.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message || 'Login failed');
      refreshCaptcha();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          Budget<span>Safe</span>
        </div>
        <p>Sign in to BudgetSafe</p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {mfaRequired && (
            <label>
              Authenticator code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={form.totp}
                onChange={(e) => setForm({ ...form, totp: e.target.value })}
              />
            </label>
          )}
          <CaptchaField
            key={captchaKey}
            value={form.captcha}
            onChange={(captcha) => setForm((f) => ({ ...f, captcha }))}
          />
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : mfaRequired ? 'Verify MFA' : 'Sign in'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1rem' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

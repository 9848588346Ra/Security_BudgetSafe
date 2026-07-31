import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import CaptchaField from '../components/CaptchaField';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '', captcha: '' });
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const refreshCaptcha = () => {
    setForm((f) => ({ ...f, captcha: '' }));
    setCaptchaKey((k) => k + 1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      await register(form);
      setOk('Account created. Sign in to continue.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      const details = err.data?.details?.map((d) => d.message).join(' ');
      setError(details || err.message || 'Registration failed');
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
        <p>Create an account</p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Display name
            <input
              required
              minLength={2}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </label>
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
              minLength={10}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <p className="muted">
            Min 10 chars with upper, lower, number, and special character.
          </p>
          <CaptchaField
            key={captchaKey}
            value={form.captcha}
            onChange={(captcha) => setForm((f) => ({ ...f, captcha }))}
          />
          {error && <div className="error">{error}</div>}
          {ok && <div className="success">{ok}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Register'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

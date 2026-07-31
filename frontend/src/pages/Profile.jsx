import { useState } from 'react';
import { api, downloadCsv } from '../api';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, setUser, refresh } = useAuth();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    currency: user?.currency || 'GBP',
  });
  const [mfa, setMfa] = useState(null);
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const data = await api('/profile', { method: 'PATCH', body: form });
      setUser(data.user);
      setOk('Profile updated');
    } catch (err) {
      setError(err.message);
    }
  };

  const setupMfa = async () => {
    setError('');
    try {
      const data = await api('/auth/mfa/setup', { method: 'POST' });
      setMfa(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyMfa = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/auth/mfa/verify', { method: 'POST', body: { totp } });
      setUser(data.user);
      setMfa(null);
      setOk('MFA enabled');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('avatar', file);
    try {
      const data = await api('/profile/avatar', { method: 'POST', body });
      setUser(data.user);
      setOk('Avatar updated');
    } catch (err) {
      setError(err.message);
    }
  };

  const exportData = async () => {
    try {
      await downloadCsv();
      setOk('Export downloaded');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Profile</h1>
          <p>Profile settings</p>
        </div>
        <button type="button" className="btn secondary" onClick={exportData}>
          Export data
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {ok && <div className="success">{ok}</div>}

      <div className="grid-2">
        <section className="panel">
          <h2>Account</h2>
          <form className="form" onSubmit={saveProfile}>
            <label>
              Display name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </label>
            <label>
              Currency
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="NPR">NPR</option>
              </select>
            </label>
            <p className="muted">Email: {user?.email}</p>
            <p className="muted">
              MFA: {user?.mfaEnabled ? 'Enabled' : 'Not enabled'}
            </p>
            <button className="btn" type="submit">
              Save profile
            </button>
          </form>

          <label style={{ marginTop: '1rem' }}>
            Avatar
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatar} />
          </label>
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              style={{ marginTop: '0.8rem', width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
        </section>

        <section className="panel">
          <h2>Multi-factor authentication</h2>
          {user?.mfaEnabled ? (
            <p className="success">TOTP MFA is active on this account.</p>
          ) : (
            <>
              <p>Enrol an authenticator app (Google Authenticator, Authy, etc.).</p>
              {!mfa ? (
                <button type="button" className="btn" onClick={setupMfa}>
                  Start MFA setup
                </button>
              ) : (
                <>
                  <img
                    src={mfa.qrDataUrl}
                    alt="MFA QR code"
                    style={{ width: 180, height: 180, background: '#fff', borderRadius: 8 }}
                  />
                  <p className="muted">Manual key: {mfa.manualEntryKey}</p>
                  <form className="form" onSubmit={verifyMfa}>
                    <label>
                      Enter code to confirm
                      <input value={totp} onChange={(e) => setTotp(e.target.value)} required />
                    </label>
                    <button className="btn" type="submit">
                      Enable MFA
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

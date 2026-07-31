import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export default function CaptchaField({ value, onChange }) {
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/captcha');
      setImage(data.image);
    } catch (err) {
      setError(err.message || 'Failed to load CAPTCHA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="captcha-field">
      <label>
        CAPTCHA
        <div className="captcha-row">
          {image ? (
            <img src={image} alt="CAPTCHA challenge" className="captcha-image" />
          ) : (
            <div className="captcha-placeholder">{loading ? 'Loading…' : '—'}</div>
          )}
          <button type="button" className="btn secondary" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
        <input
          type="text"
          required
          autoComplete="off"
          placeholder="Enter the characters shown"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

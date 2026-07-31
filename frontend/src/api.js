let csrfToken = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export function clearCsrf() {
  csrfToken = null;
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (!options.body || !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await ensureCsrf();
    headers['X-CSRF-Token'] = token;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (res.status === 403 && isJson && data.error === 'Invalid CSRF token') {
    clearCsrf();
    const retryToken = await ensureCsrf();
    headers['X-CSRF-Token'] = retryToken;
    const retry = await fetch(`/api${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
      body:
        options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body,
    });
    const retryType = retry.headers.get('content-type') || '';
    const retryData = retryType.includes('application/json') ? await retry.json() : await retry.text();
    if (!retry.ok) {
      const err = new Error(retryData.error || 'Request failed');
      err.status = retry.status;
      err.data = retryData;
      throw err;
    }
    return retryData;
  }

  if (!res.ok) {
    const err = new Error((isJson && data.error) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function downloadCsv() {
  await ensureCsrf();
  const res = await fetch('/api/export/csv', { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budgetsafe-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

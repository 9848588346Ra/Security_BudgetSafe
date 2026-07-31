function errorHandler(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  console.error(err);
  const status = err.status || 500;
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { errorHandler };

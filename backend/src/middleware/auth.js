const User = require('../models/User');

async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Session invalid' });
    }
    if (user.isDisabled) {
      req.session.destroy(() => {});
      return res.status(403).json({ error: 'Account disabled' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  return next();
}

function assertOwnership(doc, userId) {
  if (!doc) return false;
  return doc.user.toString() === userId.toString();
}

module.exports = { requireAuth, requireAdmin, assertOwnership };

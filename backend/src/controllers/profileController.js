const { body } = require('express-validator');
const path = require('path');
const User = require('../models/User');
const { pick } = require('../utils/sanitize');
const { validate } = require('../middleware/validate');

const PROFILE_FIELDS = ['displayName', 'currency'];

const updateValidators = [
  body('displayName').optional().trim().isLength({ min: 2, max: 80 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  validate,
];

async function getProfile(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

async function updateProfile(req, res, next) {
  try {
    const data = pick(req.body, PROFILE_FIELDS);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if ('role' in req.body || 'isDisabled' in req.body || 'mfaEnabled' in req.body) {
      return res.status(400).json({
        error: 'Disallowed fields in request body',
      });
    }

    Object.assign(req.user, data);
    await req.user.save();

    return res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file required' });
    }

    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    req.user.avatarUrl = `/uploads/${req.file.filename}`;
    await req.user.save();

    return res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  PROFILE_FIELDS,
  updateValidators,
  getProfile,
  updateProfile,
  uploadAvatar,
};

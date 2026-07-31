const { body, param } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { pick } = require('../utils/sanitize');
const { validate } = require('../middleware/validate');

async function stats(req, res, next) {
  try {
    const [userCount, disabledCount, flaggedCount, txCount] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isDisabled: true }),
      Transaction.countDocuments({ anomalyFlagged: true, anomalyReviewed: false }),
      Transaction.countDocuments(),
    ]);

    return res.json({
      stats: {
        users: userCount,
        disabledAccounts: disabledCount,
        openFlags: flaggedCount,
        totalTransactions: txCount,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find({ role: 'user' })
      .select('email displayName isDisabled disabledReason createdAt mfaEnabled')
      .sort({ createdAt: -1 });

    return res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        displayName: u.displayName,
        isDisabled: u.isDisabled,
        disabledReason: u.disabledReason,
        mfaEnabled: u.mfaEnabled,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const disableValidators = [
  param('id').isMongoId(),
  body('disabled').isBoolean(),
  body('reason').optional().isString().isLength({ max: 500 }),
  validate,
];

async function setDisabled(req, res, next) {
  try {
    const { disabled, reason } = pick(req.body, ['disabled', 'reason']);
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isDisabled = Boolean(disabled);
    user.disabledReason = disabled ? String(reason || 'Disabled by admin') : '';
    await user.save();

    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isDisabled: user.isDisabled,
        disabledReason: user.disabledReason,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listFlagged(req, res, next) {
  try {
    const flags = await Transaction.find({ anomalyFlagged: true })
      .select('user type amount category date anomalyReason anomalyReviewed anomalyReviewNote createdAt')
      .populate('user', 'email displayName')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      flagged: flags.map((t) => ({
        id: t._id.toString(),
        userEmail: t.user?.email,
        userDisplayName: t.user?.displayName,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        anomalyReason: t.anomalyReason,
        anomalyReviewed: t.anomalyReviewed,
        anomalyReviewNote: t.anomalyReviewNote,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

const reviewValidators = [
  param('id').isMongoId(),
  body('note').optional().isString().isLength({ max: 500 }),
  validate,
];

async function reviewFlag(req, res, next) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || !tx.anomalyFlagged) {
      return res.status(404).json({ error: 'Flagged transaction not found' });
    }

    const { note } = pick(req.body, ['note']);
    tx.anomalyReviewed = true;
    tx.anomalyReviewNote = note || 'Reviewed by admin';
    await tx.save();

    return res.json({
      id: tx._id.toString(),
      anomalyReviewed: tx.anomalyReviewed,
      anomalyReviewNote: tx.anomalyReviewNote,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  stats,
  listUsers,
  setDisabled,
  disableValidators,
  listFlagged,
  reviewFlag,
  reviewValidators,
};

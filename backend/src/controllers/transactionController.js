const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { pick } = require('../utils/sanitize');
const { validate } = require('../middleware/validate');
const { assertOwnership } = require('../middleware/auth');
const { evaluateAnomaly } = require('../services/anomalyService');
const { checkBudgetThreshold } = require('../services/budgetService');

const ALLOWED_CREATE = ['type', 'amount', 'category', 'description', 'date', 'confirmed'];
const ALLOWED_UPDATE = ['amount', 'category', 'description', 'date'];

const createValidators = [
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ gt: 0 }),
  body('category').trim().isLength({ min: 1, max: 60 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('date').optional().isISO8601(),
  body('confirmed').optional().isBoolean(),
  validate,
];

const updateValidators = [
  param('id').isMongoId(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('category').optional().trim().isLength({ min: 1, max: 60 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('date').optional().isISO8601(),
  validate,
];

async function list(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;

    const items = await Transaction.find(filter).sort({ date: -1 }).limit(500);
    return res.json({ transactions: items.map((t) => t.toSafeJSON()) });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const tx = await Transaction.findById(req.params.id);
    if (!tx || !assertOwnership(tx, req.user._id)) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json({ transaction: tx.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = pick(req.body, ALLOWED_CREATE);
    const tx = new Transaction({
      user: req.user._id,
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: data.date ? new Date(data.date) : new Date(),
      confirmed: Boolean(data.confirmed),
    });
    tx.description = data.description || '';

    if (tx.type === 'expense') {
      const anomaly = await evaluateAnomaly(req.user._id, tx.category, tx.amount, tx._id);
      if (anomaly.flagged) {
        tx.anomalyFlagged = true;
        tx.anomalyReason = anomaly.reason;
      }
    }

    await tx.save();

    if (tx.type === 'expense') {
      await checkBudgetThreshold(req.user._id, tx.category, tx.date);
    }

    return res.status(201).json({ transaction: tx.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || !assertOwnership(tx, req.user._id)) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (tx.confirmed) {
      return res.status(403).json({
        error: 'Confirmed transactions cannot be edited',
      });
    }

    const data = pick(req.body, ALLOWED_UPDATE);
    if (data.amount !== undefined) tx.amount = data.amount;
    if (data.category !== undefined) tx.category = data.category;
    if (data.date !== undefined) tx.date = new Date(data.date);
    if (data.description !== undefined) tx.description = data.description;

    await tx.save();

    if (tx.type === 'expense') {
      await checkBudgetThreshold(req.user._id, tx.category, tx.date);
    }

    return res.json({ transaction: tx.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function confirm(req, res, next) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || !assertOwnership(tx, req.user._id)) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    tx.confirmed = true;
    await tx.save();
    return res.json({ transaction: tx.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || !assertOwnership(tx, req.user._id)) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (tx.confirmed) {
      return res.status(403).json({ error: 'Confirmed transactions cannot be deleted' });
    }
    await tx.deleteOne();
    return res.json({ message: 'Transaction deleted' });
  } catch (err) {
    return next(err);
  }
}

async function summary(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getUTCMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getUTCFullYear();
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const rows = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    let income = 0;
    let expense = 0;
    const byCategory = {};

    for (const row of rows) {
      if (row._id.type === 'income') income += row.total;
      else {
        expense += row.total;
        byCategory[row._id.category] = (byCategory[row._id.category] || 0) + row.total;
      }
    }

    return res.json({
      month,
      year,
      income,
      expense,
      balance: income - expense,
      byCategory,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createValidators,
  updateValidators,
  list,
  getOne,
  create,
  update,
  confirm,
  remove,
  summary,
};

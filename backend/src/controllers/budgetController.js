const { body, param } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { pick } = require('../utils/sanitize');
const { validate } = require('../middleware/validate');
const { assertOwnership } = require('../middleware/auth');

const upsertValidators = [
  body('category').trim().isLength({ min: 1, max: 60 }),
  body('monthlyLimit').isFloat({ gt: 0 }),
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2000, max: 2100 }),
  validate,
];

async function list(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getUTCMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getUTCFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const spentRows = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spentMap = Object.fromEntries(spentRows.map((r) => [r._id, r.spent]));

    return res.json({
      month,
      year,
      budgets: budgets.map((b) => {
        const spent = spentMap[b.category] || 0;
        const pct = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
        return {
          ...b.toSafeJSON(),
          spent,
          remaining: Math.max(0, b.monthlyLimit - spent),
          progressPct: pct,
          overBudget: spent > b.monthlyLimit,
        };
      }),
    });
  } catch (err) {
    return next(err);
  }
}

async function upsert(req, res, next) {
  try {
    const data = pick(req.body, ['category', 'monthlyLimit', 'month', 'year']);

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category: data.category,
        month: data.month,
        year: data.year,
      },
      {
        $set: { monthlyLimit: data.monthlyLimit },
        $setOnInsert: {
          user: req.user._id,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ budget: budget.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget || !assertOwnership(budget, req.user._id)) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    await budget.deleteOne();
    return res.json({ message: 'Budget deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  upsertValidators,
  list,
  upsert,
  remove,
  idValidator: [param('id').isMongoId(), validate],
};

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Alert = require('../models/Alert');

async function checkBudgetThreshold(userId, category, date = new Date()) {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  const budget = await Budget.findOne({ user: userId, category, month, year });
  if (!budget) return null;

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const spentAgg = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        category,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const spent = spentAgg[0]?.total || 0;
  const ratio = spent / budget.monthlyLimit;

  if (ratio >= 0.8) {
    const pct = Math.round(ratio * 100);
    const existing = await Alert.findOne({
      user: userId,
      type: 'budget_threshold',
      category,
      createdAt: { $gte: start },
      'meta.month': month,
      'meta.year': year,
    });

    if (!existing) {
      return Alert.create({
        user: userId,
        type: 'budget_threshold',
        category,
        message: `${category} is at ${pct}% of its monthly budget (£${budget.monthlyLimit.toFixed(2)}).`,
        meta: { spent, limit: budget.monthlyLimit, month, year, pct },
      });
    }
  }

  return null;
}

module.exports = { checkBudgetThreshold };

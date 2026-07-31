const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');

const ANOMALY_MULTIPLIER = 3;
const LOOKBACK_DAYS = 30;

async function evaluateAnomaly(userId, category, amount, transactionId) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const stats = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        category,
        date: { $gte: since },
        _id: { $ne: transactionId },
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (!stats.length || stats[0].count < 3) {
    return { flagged: false };
  }

  const avg = stats[0].avg;
  const threshold = avg * ANOMALY_MULTIPLIER;

  if (amount > threshold) {
    const reason = `Amount ${amount.toFixed(2)} exceeds 3× 30-day average (${avg.toFixed(2)}) for category "${category}"`;
    await Alert.create({
      user: userId,
      type: 'anomaly',
      category,
      message: reason,
      meta: { transactionId, amount, average: avg, threshold },
    });
    return { flagged: true, reason };
  }

  return { flagged: false };
}

module.exports = { evaluateAnomaly, ANOMALY_MULTIPLIER, LOOKBACK_DAYS };

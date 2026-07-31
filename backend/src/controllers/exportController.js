const Transaction = require('../models/Transaction');

async function exportCsv(req, res, next) {
  try {
    if (req.query.userId || req.body?.userId) {
      return res.status(403).json({
        error: 'Export of other users\' data is forbidden',
      });
    }

    const txs = await Transaction.find({ user: req.user._id }).sort({ date: -1 });

    const header = 'id,type,amount,category,description,date,confirmed,anomalyFlagged\n';
    const rows = txs
      .map((t) => {
        const desc = String(t.description).replace(/"/g, '""');
        return [
          t._id.toString(),
          t.type,
          t.amount,
          `"${t.category.replace(/"/g, '""')}"`,
          `"${desc}"`,
          t.date.toISOString(),
          t.confirmed,
          t.anomalyFlagged,
        ].join(',');
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="budgetsafe-export-${req.user._id}.csv"`
    );
    return res.send(header + rows);
  } catch (err) {
    return next(err);
  }
}

module.exports = { exportCsv };

const Alert = require('../models/Alert');
const { assertOwnership } = require('../middleware/auth');

async function list(req, res, next) {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.json({ alerts: alerts.map((a) => a.toSafeJSON()) });
  } catch (err) {
    return next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert || !assertOwnership(alert, req.user._id)) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    alert.read = true;
    await alert.save();
    return res.json({ alert: alert.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Alert.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    return res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, markRead, markAllRead };

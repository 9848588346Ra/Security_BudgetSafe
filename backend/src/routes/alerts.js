const express = require('express');
const alerts = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', alerts.list);
router.post('/read-all', alerts.markAllRead);
router.post('/:id/read', alerts.markRead);

module.exports = router;

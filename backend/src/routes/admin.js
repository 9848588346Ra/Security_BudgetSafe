const express = require('express');
const admin = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', admin.stats);
router.get('/users', admin.listUsers);
router.patch('/users/:id/disable', admin.disableValidators, admin.setDisabled);
router.get('/flagged', admin.listFlagged);
router.post('/flagged/:id/review', admin.reviewValidators, admin.reviewFlag);

module.exports = router;

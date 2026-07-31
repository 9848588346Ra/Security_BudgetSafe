const express = require('express');
const { exportCsv } = require('../controllers/exportController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/csv', requireAuth, exportCsv);

module.exports = router;

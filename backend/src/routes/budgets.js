const express = require('express');
const budget = require('../controllers/budgetController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', budget.list);
router.put('/', budget.upsertValidators, budget.upsert);
router.delete('/:id', budget.idValidator, budget.remove);

module.exports = router;

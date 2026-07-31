const express = require('express');
const tx = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', tx.summary);
router.get('/', tx.list);
router.get('/:id', tx.getOne);
router.post('/', tx.createValidators, tx.create);
router.patch('/:id', tx.updateValidators, tx.update);
router.post('/:id/confirm', tx.confirm);
router.delete('/:id', tx.remove);

module.exports = router;

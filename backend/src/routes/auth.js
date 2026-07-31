const express = require('express');
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/captcha', auth.getCaptcha);
router.post('/register', authLimiter, auth.registerValidators, auth.register);
router.post('/login', authLimiter, auth.loginValidators, auth.login);
router.post('/logout', requireAuth, auth.logout);
router.get('/me', requireAuth, auth.me);
router.post('/mfa/setup', requireAuth, auth.setupMfa);
router.post('/mfa/verify', requireAuth, auth.verifyMfa);

module.exports = router;

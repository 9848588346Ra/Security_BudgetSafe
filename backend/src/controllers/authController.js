const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body } = require('express-validator');
const User = require('../models/User');
const { pick } = require('../utils/sanitize');
const { validate } = require('../middleware/validate');
const { createCaptchaChallenge, consumeCaptcha } = require('../utils/captcha');

const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 10 })
    .withMessage('Password must be at least 10 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain a special character'),
  body('displayName').trim().isLength({ min: 2, max: 80 }).withMessage('Display name required'),
  body('captcha').trim().notEmpty().withMessage('CAPTCHA is required'),
  validate,
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('captcha').trim().notEmpty().withMessage('CAPTCHA is required'),
  validate,
];

async function getCaptcha(req, res, next) {
  try {
    const svg = createCaptchaChallenge(req);
    return res.json({
      svg,
      image: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const captchaCheck = consumeCaptcha(req);
    if (!captchaCheck.ok) {
      return res.status(400).json({ error: captchaCheck.error });
    }

    const { email, password, displayName } = pick(req.body, ['email', 'password', 'displayName']);

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = new User({ email, displayName });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json({
      message: 'Registration successful. Please log in and enrol MFA.',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const captchaCheck = consumeCaptcha(req);
    if (!captchaCheck.ok) {
      return res.status(400).json({ error: captchaCheck.error });
    }

    const { email, password, totp } = pick(req.body, ['email', 'password', 'totp']);

    const user = await User.findOne({ email }).select(
      '+passwordHash +failedLoginAttempts +lockUntil +mfaSecretEncrypted'
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account temporarily locked due to failed login attempts',
        lockUntil: user.lockUntil,
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.registerFailedLogin();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.mfaEnabled) {
      if (!totp) {
        return res.status(200).json({
          mfaRequired: true,
          message: 'Enter your authenticator code to complete login',
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.getMfaSecret(),
        encoding: 'base32',
        token: String(totp),
        window: 1,
      });

      if (!verified) {
        await user.registerFailedLogin();
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    await user.resetLoginAttempts();

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.userId = user._id.toString();
    req.session.role = user.role;

    return res.json({
      message: 'Login successful',
      user: user.toSafeJSON(),
      mfaEnabled: user.mfaEnabled,
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out' });
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

async function setupMfa(req, res, next) {
  try {
    if (req.user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `BudgetSafe (${req.user.email})`,
      length: 32,
    });

    req.user.setMfaSecret(secret.base32);
    await req.user.save();

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      message: 'Scan the QR code with your authenticator app, then verify',
      qrDataUrl,
      manualEntryKey: secret.base32,
    });
  } catch (err) {
    return next(err);
  }
}

async function verifyMfa(req, res, next) {
  try {
    const { totp } = pick(req.body, ['totp']);
    if (!totp) {
      return res.status(400).json({ error: 'TOTP code required' });
    }

    const user = await User.findById(req.user._id).select('+mfaSecretEncrypted');
    if (!user.mfaSecretEncrypted) {
      return res.status(400).json({ error: 'Run MFA setup first' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.getMfaSecret(),
      encoding: 'base32',
      token: String(totp),
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    user.mfaEnabled = true;
    await user.save();

    return res.json({ message: 'MFA enabled successfully', user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  registerValidators,
  loginValidators,
  getCaptcha,
  register,
  login,
  logout,
  me,
  setupMfa,
  verifyMfa,
};

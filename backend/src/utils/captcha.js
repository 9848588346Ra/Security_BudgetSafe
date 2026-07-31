const svgCaptcha = require('svg-captcha');

function createCaptchaChallenge(req) {
  const captcha = svgCaptcha.create({
    size: 5,
    ignoreChars: '0oO1ilI',
    noise: 3,
    color: true,
    background: '#0e2a22',
    width: 160,
    height: 48,
  });

  req.session.captcha = String(captcha.text).toLowerCase();
  req.session.captchaExpires = Date.now() + 5 * 60 * 1000;
  req.session.csrfPrimed = true;

  return captcha.data;
}

function consumeCaptcha(req) {
  const expected = req.session?.captcha;
  const expires = req.session?.captchaExpires || 0;
  const provided = String(req.body?.captcha || '').trim().toLowerCase();

  delete req.session.captcha;
  delete req.session.captchaExpires;

  if (!expected || Date.now() > expires) {
    return { ok: false, error: 'CAPTCHA expired. Please refresh and try again.' };
  }

  if (!provided || provided !== expected) {
    return { ok: false, error: 'Invalid CAPTCHA' };
  }

  return { ok: true };
}

module.exports = { createCaptchaChallenge, consumeCaptcha };

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const config = require('./config');
const { globalLimiter } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const profileRoutes = require('./routes/profile');
const alertRoutes = require('./routes/alerts');
const exportRoutes = require('./routes/export');
const adminRoutes = require('./routes/admin');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const allowedOrigins = String(config.clientUrl || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (
          config.env === 'development' &&
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
            origin
          )
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(globalLimiter);

  app.use(
    session({
      name: 'budgetsafe.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: MongoStore.create({
        mongoUrl: config.mongoUri,
        ttl: 60 * 60 * 8,
      }),
      cookie: {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8,
      },
    })
  );

  const csrfProtection = csurf({ cookie: false });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'BudgetSafe' });
  });

  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    req.session.csrfPrimed = true;
    res.json({ csrfToken: req.csrfToken() });
  });

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use('/api', csrfProtection);

  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

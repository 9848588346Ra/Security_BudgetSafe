require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
const { createApp } = require('./app');

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`BudgetSafe API listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

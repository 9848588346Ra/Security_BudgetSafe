require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

async function seed() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
  ]);

  const admin = new User({
    email: 'admin@budgetsafe.local',
    displayName: 'Platform Admin',
    role: 'admin',
    currency: 'GBP',
  });
  await admin.setPassword('AdminPass1!');
  await admin.save();

  const user = new User({
    email: 'demo@budgetsafe.local',
    displayName: 'Demo User',
    role: 'user',
    currency: 'GBP',
  });
  await user.setPassword('DemoPass1!');
  await user.save();

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const categories = ['Groceries', 'Transport', 'Entertainment', 'Utilities'];
  for (const category of categories) {
    await Budget.create({
      user: user._id,
      category,
      monthlyLimit: category === 'Groceries' ? 300 : 150,
      month,
      year,
    });
  }

  const baseAmounts = [25, 30, 28, 32, 27];
  for (const amount of baseAmounts) {
    const tx = new Transaction({
      user: user._id,
      type: 'expense',
      amount,
      category: 'Groceries',
      date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
      confirmed: true,
    });
    tx.description = 'Weekly shop';
    await tx.save();
  }

  const income = new Transaction({
    user: user._id,
    type: 'income',
    amount: 2200,
    category: 'Salary',
    date: new Date(Date.UTC(year, month - 1, 1)),
    confirmed: true,
  });
  income.description = 'Monthly salary';
  await income.save();

  console.log('Seed complete');
  console.log('Admin: admin@budgetsafe.local / AdminPass1!');
  console.log('User:  demo@budgetsafe.local / DemoPass1!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

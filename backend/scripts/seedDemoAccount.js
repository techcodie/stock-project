/**
 * Seed Demo Account
 *
 * Creates (or resets) a ready-to-show demo account so anyone reviewing the
 * project can click "Try Demo Account" on the login page and land in a fully
 * populated app — holdings, transaction history, and a wallet.
 *
 * Login:  demo@demo.com  /  demo123
 *
 * Run:
 *   node scripts/seedDemoAccount.js
 *   npm run seed:demo
 *
 * Tip: run `node scripts/seedSamples.js demo@demo.com` afterwards to also give
 * the demo account the 3 sample AI Research documents.
 *
 * Safe to run repeatedly — it wipes the demo account's old trades first.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO = { name: 'Demo User', email: 'demo@demo.com', password: 'demo123' };
const STARTING_BALANCE = 1_000_000;

// Each holding aims for a rough rupee amount; the quantity is worked out from
// the live price, so the demo looks sensible no matter what the prices are.
// `factor` sets the buy price relative to the live price, which creates a
// realistic mix of gains (factor < 1) and losses (factor > 1).
const PLAN = [
  { symbol: 'TCS', daysAgo: 45, target: 120000, factor: 0.92 },
  { symbol: 'INFY', daysAgo: 40, target: 90000, factor: 0.95 },
  { symbol: 'HDFC', daysAgo: 35, target: 60000, factor: 0.9 },
  { symbol: 'RELIANCE', daysAgo: 30, target: 80000, factor: 1.05 },
  { symbol: 'ICICIBANK', daysAgo: 22, target: 50000, factor: 0.94 },
  { symbol: 'SBIN', daysAgo: 12, target: 70000, factor: 0.97 },
  { symbol: 'BHARTIARTL', daysAgo: 4, target: 40000, factor: 0.99 },
];

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10, 30, 0, 0);
  return d;
}

async function main() {
  // 1. Make sure the demo user exists (and its password is always demo123).
  const hashed = await bcrypt.hash(DEMO.password, 10);
  let user = await prisma.user.findUnique({ where: { email: DEMO.email } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: DEMO.name, email: DEMO.email, password: hashed },
    });
    console.log(`Created demo user ${DEMO.email}`);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    console.log(`Demo user ${DEMO.email} already exists — resetting its data`);
  }

  // 2. Clear any previous demo trades so re-runs start clean.
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.portfolio.deleteMany({ where: { userId: user.id } });

  // 3. Look up current stock prices.
  const stocks = await prisma.stock.findMany();
  const bySymbol = Object.fromEntries(stocks.map((s) => [s.symbol, s]));

  let cash = STARTING_BALANCE;

  // 4. Create one BUY (transaction + holding) per stock in the plan.
  for (const item of PLAN) {
    const stock = bySymbol[item.symbol];
    if (!stock) {
      console.log(`  skip ${item.symbol} (not in DB)`);
      continue;
    }
    const buyPrice = Math.round(stock.currentPrice * item.factor * 100) / 100;
    const quantity = Math.max(1, Math.round(item.target / buyPrice));
    const cost = quantity * buyPrice;
    if (cost > cash) {
      console.log(`  skip ${item.symbol} (not enough cash)`);
      continue;
    }
    cash -= cost;

    await prisma.transaction.create({
      data: {
        type: 'BUY',
        quantity,
        price: buyPrice,
        userId: user.id,
        stockId: stock.id,
        createdAt: dateDaysAgo(item.daysAgo),
      },
    });
    await prisma.portfolio.create({
      data: { userId: user.id, stockId: stock.id, quantity, avgBuyPrice: buyPrice },
    });
    console.log(`  BUY  ${String(quantity).padStart(4)} ${item.symbol.padEnd(11)} @ ₹${buyPrice}`);
  }

  // 5. One small SELL so the transaction history shows both buys and sells.
  const tcs = bySymbol['TCS'];
  const tcsHolding = tcs
    ? await prisma.portfolio.findUnique({
        where: { userId_stockId: { userId: user.id, stockId: tcs.id } },
      })
    : null;
  if (tcsHolding && tcsHolding.quantity > 3) {
    const sellQty = 3;
    const sellPrice = Math.round(tcs.currentPrice * 100) / 100;
    cash += sellQty * sellPrice;
    await prisma.transaction.create({
      data: {
        type: 'SELL',
        quantity: sellQty,
        price: sellPrice,
        userId: user.id,
        stockId: tcs.id,
        createdAt: dateDaysAgo(8),
      },
    });
    await prisma.portfolio.update({
      where: { userId_stockId: { userId: user.id, stockId: tcs.id } },
      data: { quantity: tcsHolding.quantity - sellQty },
    });
    console.log(`  SELL    3 TCS         @ ₹${sellPrice}`);
  }

  // 6. Save the leftover cash as the wallet balance.
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: cash },
    create: { userId: user.id, balance: cash },
  });

  console.log(`\nDemo account ready:  ${DEMO.email}  /  ${DEMO.password}`);
  console.log(`Wallet balance: ₹${cash.toFixed(2)}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

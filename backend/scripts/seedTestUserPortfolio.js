/**
 * Seed Test User Portfolio
 *
 * Wipes testuser@gmail.com's existing trading activity and replaces it with
 * a realistic 60-day history: 11 buys + 2 partial sells across 9 stocks.
 *
 * Resulting state:
 *   - 9 active holdings (IT, banking, FMCG, energy, diversified)
 *   - Wallet ~₹5.6 lakhs (started at ₹10L)
 *   - Mix of profit/loss positions based on current simulated prices
 *
 * Run:
 *   node scripts/seedTestUserPortfolio.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_EMAIL = 'testuser@gmail.com';
const STARTING_BALANCE = 1_000_000;

// Trade plan: chronological, daysAgo measured from "now".
// Prices are realistic relative to each stock's current simulated price.
const TRADES = [
  { daysAgo: 60, type: 'BUY',  symbol: 'TCS',        quantity: 50,  price: 5100.00 },
  { daysAgo: 55, type: 'BUY',  symbol: 'INFY',       quantity: 30,  price: 1850.00 },
  { daysAgo: 50, type: 'BUY',  symbol: 'HDFC',       quantity: 100, price: 430.00  },
  { daysAgo: 45, type: 'BUY',  symbol: 'RELIANCE',   quantity: 25,  price: 880.00  },
  { daysAgo: 40, type: 'BUY',  symbol: 'ICICIBANK',  quantity: 20,  price: 1380.00 },
  { daysAgo: 35, type: 'BUY',  symbol: 'ITC',        quantity: 200, price: 46.00   },
  { daysAgo: 30, type: 'BUY',  symbol: 'BHARTIARTL', quantity: 50,  price: 195.00  },
  { daysAgo: 25, type: 'BUY',  symbol: 'INFY',       quantity: 30,  price: 1890.00 }, // averaging up
  { daysAgo: 20, type: 'SELL', symbol: 'TCS',        quantity: 20,  price: 5180.00 }, // partial profit-take
  { daysAgo: 15, type: 'BUY',  symbol: 'ASIANPAINT', quantity: 15,  price: 790.00  },
  { daysAgo: 10, type: 'BUY',  symbol: 'SBIN',       quantity: 75,  price: 525.00  },
  { daysAgo: 5,  type: 'SELL', symbol: 'ITC',        quantity: 200, price: 47.50   }, // small profit
  { daysAgo: 2,  type: 'BUY',  symbol: 'KOTAKBANK',  quantity: 10,  price: 1820.00 },
];

function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  // Slightly randomize the time of day so it looks human, not script-generated.
  d.setHours(9 + Math.floor(Math.random() * 7));
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  // ---- 1. Resolve user + stocks ----
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { wallet: true },
  });
  if (!user) throw new Error(`No user with email ${TARGET_EMAIL}`);

  const allStocks = await prisma.stock.findMany();
  const stockBySymbol = Object.fromEntries(allStocks.map((s) => [s.symbol, s]));
  for (const t of TRADES) {
    if (!stockBySymbol[t.symbol]) {
      throw new Error(`Stock not found in DB: ${t.symbol}`);
    }
  }

  console.log(`Resetting trading state for ${TARGET_EMAIL} (${user.id})`);

  // ---- 2. Wipe existing transactions + portfolio for this user ----
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.portfolio.deleteMany({ where: { userId: user.id } });

  // ---- 3. Reset wallet to starting balance ----
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: STARTING_BALANCE },
    create: { userId: user.id, balance: STARTING_BALANCE },
  });

  // ---- 4. Replay trades in chronological order ----
  // Maintain in-memory portfolio map: symbol -> { qty, totalCost }
  // Recompute avgBuyPrice from running total cost so it matches the
  // controller's logic (weighted average cost basis).
  const portfolioMap = {};
  let cash = STARTING_BALANCE;
  let totalTx = 0;

  for (const t of TRADES) {
    const stock = stockBySymbol[t.symbol];
    const when = dateDaysAgo(t.daysAgo);
    const gross = t.quantity * t.price;

    if (t.type === 'BUY') {
      if (cash < gross) throw new Error(`Insufficient cash for ${t.symbol} BUY on day -${t.daysAgo}`);
      cash -= gross;
      const pos = portfolioMap[t.symbol] || { qty: 0, totalCost: 0 };
      pos.qty += t.quantity;
      pos.totalCost += gross;
      portfolioMap[t.symbol] = pos;
    } else {
      const pos = portfolioMap[t.symbol];
      if (!pos || pos.qty < t.quantity) {
        throw new Error(`Cannot SELL ${t.quantity} ${t.symbol} — only own ${pos?.qty || 0}`);
      }
      // Reduce cost basis proportionally (FIFO-ish using avg cost).
      const avgCost = pos.totalCost / pos.qty;
      pos.totalCost -= avgCost * t.quantity;
      pos.qty -= t.quantity;
      cash += gross;
      if (pos.qty === 0) delete portfolioMap[t.symbol];
      else portfolioMap[t.symbol] = pos;
    }

    await prisma.transaction.create({
      data: {
        type: t.type,
        quantity: t.quantity,
        price: t.price,
        userId: user.id,
        stockId: stock.id,
        createdAt: when,
      },
    });
    totalTx++;
    console.log(`  ${when.toISOString().slice(0,10)} ${t.type.padEnd(4)} ${String(t.quantity).padStart(4)} ${t.symbol.padEnd(11)} @ ₹${t.price.toFixed(2)}`);
  }

  // ---- 5. Write final portfolio rows from the in-memory map ----
  for (const [symbol, pos] of Object.entries(portfolioMap)) {
    const stock = stockBySymbol[symbol];
    const avgBuyPrice = pos.totalCost / pos.qty;
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        stockId: stock.id,
        quantity: pos.qty,
        avgBuyPrice,
      },
    });
  }

  // ---- 6. Update wallet to reflect net cash ----
  await prisma.wallet.update({
    where: { userId: user.id },
    data: { balance: cash },
  });

  console.log();
  console.log('Final state:');
  console.log('  Transactions:', totalTx);
  console.log('  Holdings:', Object.keys(portfolioMap).length);
  console.log('  Wallet:      ₹' + cash.toFixed(2));
  console.log();
  console.log('Holdings detail (avg cost basis):');
  for (const [symbol, pos] of Object.entries(portfolioMap)) {
    const avg = pos.totalCost / pos.qty;
    console.log(`  ${symbol.padEnd(11)} qty=${String(pos.qty).padStart(4)}  avg=₹${avg.toFixed(2).padStart(9)}  invested=₹${pos.totalCost.toFixed(2)}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

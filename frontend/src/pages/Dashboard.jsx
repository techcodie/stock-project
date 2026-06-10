import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Briefcase, TrendingUp, Coins, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import StockSearch from '../components/StockSearch';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Reveal, Stagger, StaggerItem, CountUp } from '../components/ui/motion';
import { cn } from '../lib/utils';

const inr = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const fetchData = async () => {
    try {
      const [walletRes, portfolioRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/portfolio'),
      ]);
      setBalance(walletRes.data.data.balance);
      setPortfolio(portfolioRes.data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset your account? This will clear all your holdings and transactions, and restore your balance to ₹10,00,000.',
      )
    ) {
      return;
    }
    setResetting(true);
    setResetMessage('');
    try {
      const response = await api.post('/wallet/reset-account');
      if (response.data.success) {
        setResetMessage(response.data.message);
        await fetchData();
      }
    } catch (err) {
      setResetMessage(err.response?.data?.message || 'Failed to reset account');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalProfitLoss = portfolio.reduce((sum, item) => sum + (item.profitLoss || 0), 0);
  const totalNetWorth = balance + totalPortfolioValue;

  const stats = [
    { label: 'Wallet Balance', amount: balance, prefix: '₹', icon: Wallet },
    { label: 'Portfolio Value', amount: totalPortfolioValue, prefix: '₹', icon: Briefcase },
    {
      label: 'Total Profit / Loss',
      amount: Math.abs(totalProfitLoss),
      prefix: totalProfitLoss >= 0 ? '+₹' : '-₹',
      icon: TrendingUp,
      tone: totalProfitLoss >= 0 ? 'up' : 'down',
    },
    { label: 'Net Worth', amount: totalNetWorth, prefix: '₹', icon: Coins, highlight: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your portfolio performance and market overview
          </p>
        </div>
        <Link to="/trade">
          <Button>Trade Stocks</Button>
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {totalNetWorth < 50000 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Low net worth alert</p>
              <p className="text-sm text-muted-foreground">
                Your net worth has fallen below ₹50,000. You can reset your account to start fresh
                with ₹10,00,000.
              </p>
              {resetMessage && <p className="mt-1 text-sm text-emerald-400">{resetMessage}</p>}
            </div>
            <Button variant="outline" onClick={handleResetAccount} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Account'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <Stagger className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, amount, prefix, icon: Icon, tone, highlight }) => (
          <StaggerItem key={label} lift>
            <Card className={cn('h-full', highlight && 'border-primary/40')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CountUp
                  value={amount}
                  prefix={prefix}
                  className={cn(
                    'mt-3 block text-2xl font-bold tabular-nums',
                    tone === 'up' && 'text-emerald-400',
                    tone === 'down' && 'text-red-400',
                    !tone && 'text-foreground',
                  )}
                />
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.1}>
        <StockSearch />
      </Reveal>

      {/* Holdings */}
      <Reveal delay={0.15} className="mt-8">
        <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">You don&apos;t own any stocks yet.</p>
              <Link to="/trade">
                <Button variant="outline" size="sm">
                  Start Trading Now
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.map((item) => (
                  <TableRow key={item.stock.symbol}>
                    <TableCell className="font-semibold text-foreground">{item.stock.symbol}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">₹{item.avgBuyPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">₹{item.stock.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">₹{inr(item.currentValue)}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium tabular-nums',
                        item.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {item.profitLoss >= 0 ? '+' : ''}
                      {item.profitLossPercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

export default Dashboard;

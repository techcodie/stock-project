import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Wallet, Briefcase, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolio = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const response = await api.get('/portfolio');
      if (response.data.success) setPortfolio(response.data.data || []);
    } catch (err) {
      console.error('Portfolio error:', err);
      setError(err.response?.data?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(() => fetchPortfolio(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const totalInvestment = portfolio.reduce((sum, item) => sum + item.avgBuyPrice * item.quantity, 0);
  const totalCurrentValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalProfitLoss = portfolio.reduce((sum, item) => sum + (item.profitLoss || 0), 0);
  const profitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const summary = [
    { label: 'Total Investment', amount: totalInvestment, prefix: '₹', icon: Wallet },
    { label: 'Current Value', amount: totalCurrentValue, prefix: '₹', icon: Briefcase },
    {
      label: 'Total P/L',
      amount: Math.abs(totalProfitLoss),
      prefix: totalProfitLoss >= 0 ? '+₹' : '-₹',
      pct: profitLossPercent,
      icon: TrendingUp,
      tone: totalProfitLoss >= 0 ? 'up' : 'down',
      highlight: true,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">My Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your investments and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchPortfolio()} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Link to="/trade">
            <Button>Trade Stocks</Button>
          </Link>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {portfolio.length > 0 && (
        <Stagger className="mb-8 grid gap-4 sm:grid-cols-3">
          {summary.map(({ label, amount, prefix, pct, icon: Icon, tone, highlight }) => (
            <StaggerItem key={label} lift>
              <Card className={cn('h-full', highlight && 'border-primary/40')}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p
                    className={cn(
                      'mt-3 text-2xl font-bold tabular-nums',
                      tone === 'up' && 'text-emerald-400',
                      tone === 'down' && 'text-red-400',
                      !tone && 'text-foreground',
                    )}
                  >
                    <CountUp value={amount} prefix={prefix} />
                    {pct !== undefined && (
                      <span className="ml-2 text-sm font-medium">
                        ({pct >= 0 ? '+' : ''}
                        {pct.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal delay={0.1}>
      {portfolio.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No holdings yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start trading to build your portfolio and track your investments.
            </p>
            <Link to="/trade">
              <Button className="mt-2">Start Trading</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Your Holdings</CardTitle>
            <Badge variant="secondary">
              {portfolio.length} {portfolio.length === 1 ? 'Stock' : 'Stocks'}
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg Buy</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right">P/L %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.map((holding) => {
                  const up = (holding.profitLoss || 0) >= 0;
                  return (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{holding.stock?.symbol || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{holding.stock?.name || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{holding.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{holding.avgBuyPrice?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground">
                        ₹{holding.stock?.currentPrice?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">₹{inr(holding.currentValue || 0)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          up ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {up ? '+' : ''}₹{Math.abs(holding.profitLoss || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={up ? 'success' : 'danger'}>
                          {up ? '↑' : '↓'} {Math.abs(holding.profitLossPercent || 0).toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </Reveal>
    </div>
  );
}

export default Portfolio;

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDownLeft, ArrowUpRight, Receipt, Clock } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { motion as Motion } from 'motion/react';
import { Reveal, Stagger, StaggerItem, CountUp } from '../components/ui/motion';
import { cn } from '../lib/utils';

const inr = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/transactions');
      if (response.data.success) setTransactions(response.data.data || []);
    } catch (err) {
      console.error('Transactions error:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const filteredTransactions = transactions.filter((t) => filter === 'ALL' || t.type === filter);
  const buyCount = transactions.filter((t) => t.type === 'BUY').length;
  const sellCount = transactions.filter((t) => t.type === 'SELL').length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.quantity * t.price, 0);

  const stats = [
    { label: 'Buy Orders', amount: buyCount, prefix: '' },
    { label: 'Sell Orders', amount: sellCount, prefix: '' },
    { label: 'Total Volume', amount: totalVolume, prefix: '₹' },
    { label: 'Total Trades', amount: transactions.length, prefix: '' },
  ];

  const tabs = [
    { key: 'ALL', label: `All (${transactions.length})` },
    { key: 'BUY', label: `Buy (${buyCount})` },
    { key: 'SELL', label: `Sell (${sellCount})` },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Transaction History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">View all your trading activity</p>
        </div>
        <Button variant="outline" onClick={fetchTransactions}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {transactions.length > 0 && (
        <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, amount, prefix }) => (
            <StaggerItem key={label} lift>
              <Card className="h-full">
                <CardContent className="p-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <CountUp
                    value={amount}
                    prefix={prefix}
                    decimals={0}
                    className="mt-2 block text-2xl font-bold tabular-nums text-foreground"
                  />
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {transactions.length > 0 && (
        <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1 backdrop-blur-xl">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              >
                {active && (
                  <Motion.span
                    layoutId="txn-tab-pill"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={cn('relative z-10', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No transactions yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your trading history will appear here once you start buying or selling stocks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, i) => {
            const isBuy = transaction.type === 'BUY';
            return (
              <Reveal key={transaction.id} delay={Math.min(i * 0.04, 0.4)}>
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <Badge variant={isBuy ? 'success' : 'danger'}>
                    {isBuy ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    {transaction.type}
                  </Badge>

                  <div className="min-w-[8rem]">
                    <div className="font-semibold text-foreground">{transaction.stock?.symbol || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.stock?.name || 'Unknown Stock'}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-wrap justify-end gap-x-8 gap-y-2 text-sm">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Quantity</div>
                      <div className="font-medium tabular-nums text-foreground">{transaction.quantity} shares</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-medium tabular-nums text-foreground">₹{transaction.price?.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-semibold tabular-nums text-foreground">
                        ₹{inr(transaction.quantity * transaction.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {timeAgo(transaction.createdAt)}
                  </div>
                </CardContent>
              </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Transactions;

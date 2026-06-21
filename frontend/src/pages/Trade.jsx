import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2, Loader2, LineChart } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Reveal, Stagger, StaggerItem } from '../components/ui/motion';
import PredictionCard from '../components/ai/PredictionCard';
import { cn } from '../lib/utils';

const inr = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Trade() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);

  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const [sellMessage, setSellMessage] = useState('');
  const [buyError, setBuyError] = useState('');
  const [sellError, setSellError] = useState('');

  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await api.get('/stocks');
        if (response.data.success) setStocks(response.data.data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const [walletRes, portfolioRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/portfolio'),
        ]);
        setBalance(walletRes.data.data.balance);
        setPortfolio(portfolioRes.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchStocks();
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!selectedStock) return;

    const fetchPrice = async () => {
      try {
        const response = await api.get(`/stocks/${selectedStock.id}`);
        if (response.data.success) {
          const newPrice = response.data.data.currentPrice;
          setCurrentPrice((prev) => {
            if (prev !== null) {
              setPriceChange(newPrice - prev);
            }
            return newPrice;
          });
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [selectedStock]);

  const handleStockSelect = (e) => {
    const stockId = e.target.value;
    if (!stockId) {
      setSelectedStock(null);
      setCurrentPrice(null);
      setPriceChange(0);
      return;
    }
    const stock = stocks.find((s) => s.id === stockId);
    setSelectedStock(stock);
    setCurrentPrice(stock.currentPrice);
    setPriceChange(0);
    setBuyMessage('');
    setSellMessage('');
    setBuyError('');
    setSellError('');
  };

  const refreshUserData = async () => {
    const [walletRes, portfolioRes] = await Promise.all([
      api.get('/wallet/balance'),
      api.get('/portfolio'),
    ]);
    setBalance(walletRes.data.data.balance);
    setPortfolio(portfolioRes.data.data);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    if (!selectedStock || !buyQuantity) return;
    setBuyLoading(true);
    setBuyMessage('');
    setBuyError('');
    try {
      const response = await api.post('/trade/buy', {
        stockId: selectedStock.id,
        quantity: parseInt(buyQuantity),
      });
      if (response.data.success) {
        setBuyMessage(response.data.message);
        setBuyQuantity('');
        await refreshUserData();
      }
    } catch (error) {
      setBuyError(error.response?.data?.message || 'Failed to buy stock');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!selectedStock || !sellQuantity) return;
    setSellLoading(true);
    setSellMessage('');
    setSellError('');
    try {
      const response = await api.post('/trade/sell', {
        stockId: selectedStock.id,
        quantity: parseInt(sellQuantity),
      });
      if (response.data.success) {
        setSellMessage(response.data.message);
        setSellQuantity('');
        await refreshUserData();
      }
    } catch (error) {
      setSellError(error.response?.data?.message || 'Failed to sell stock');
    } finally {
      setSellLoading(false);
    }
  };

  const buyTotal = buyQuantity && currentPrice ? buyQuantity * currentPrice : 0;
  const sellTotal = sellQuantity && currentPrice ? sellQuantity * currentPrice : 0;
  const ownedQuantity = selectedStock
    ? portfolio.find((p) => p.stock.id === selectedStock.id)?.quantity || 0
    : 0;
  const canAfford = buyTotal <= balance;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Trade Stocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time stock trading with live prices</p>
      </header>

      {/* Stock selector */}
      <Reveal className="mb-6 block">
      <Card>
        <CardContent className="space-y-2 p-5">
          <Label htmlFor="stock-select">Select a stock to trade</Label>
          <select
            id="stock-select"
            value={selectedStock?.id || ''}
            onChange={handleStockSelect}
            className="flex h-10 w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:bg-zinc-900"
          >
            <option value="">— Choose a stock —</option>
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.symbol} — {stock.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      </Reveal>

      {/* Price display */}
      {selectedStock && currentPrice !== null && (
        <Reveal className="mb-6 block">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedStock.symbol}</h2>
              <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Price</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                ₹{inr(currentPrice)}
              </div>
              {priceChange !== 0 && (
                <div
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    priceChange > 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {priceChange > 0 ? '↑' : '↓'} ₹{Math.abs(priceChange).toFixed(2)}
                </div>
              )}
            </div>
            <div className="w-full border-t border-border pt-3 text-sm text-muted-foreground">
              Your holdings: <span className="font-semibold text-foreground">{ownedQuantity} shares</span>
            </div>
          </CardContent>
        </Card>
        </Reveal>
      )}

      {/* AI price prediction (Python ML microservice) */}
      {selectedStock && (
        <Reveal className="mb-6 block">
          <PredictionCard symbol={selectedStock.symbol} />
        </Reveal>
      )}

      {/* Trade forms */}
      {selectedStock && currentPrice !== null && (
        <Stagger className="grid gap-6 md:grid-cols-2">
          {/* Buy */}
          <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                  <ArrowDownLeft className="h-4 w-4" />
                </span>
                Buy {selectedStock.symbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBuy} className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-border bg-white/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Available balance</span>
                  <span className="font-semibold tabular-nums text-foreground">₹{inr(balance)}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buy-quantity">Quantity (shares)</Label>
                  <Input
                    type="number"
                    id="buy-quantity"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                    min="1"
                    placeholder="Enter quantity"
                    disabled={buyLoading}
                  />
                </div>

                {buyQuantity && (
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                      canAfford ? 'bg-white/5' : 'bg-destructive/10',
                    )}
                  >
                    <span className="text-muted-foreground">Total cost</span>
                    <span className="font-semibold tabular-nums text-foreground">₹{inr(buyTotal)}</span>
                  </div>
                )}

                {!canAfford && buyQuantity && (
                  <p className="text-sm text-amber-400">⚠️ Insufficient balance</p>
                )}

                {buyMessage && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {buyMessage}
                  </div>
                )}
                {buyError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {buyError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={buyLoading || !buyQuantity || !canAfford}>
                  {buyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Buy {buyQuantity || 0} Shares</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          </StaggerItem>

          {/* Sell */}
          <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/15 text-red-400">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                Sell {selectedStock.symbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSell} className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-border bg-white/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Your holdings</span>
                  <span className="font-semibold tabular-nums text-foreground">{ownedQuantity} shares</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell-quantity">Quantity (shares)</Label>
                  <Input
                    type="number"
                    id="sell-quantity"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    min="1"
                    max={ownedQuantity}
                    placeholder="Enter quantity"
                    disabled={sellLoading || ownedQuantity === 0}
                  />
                </div>

                {sellQuantity && (
                  <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Total proceeds</span>
                    <span className="font-semibold tabular-nums text-foreground">₹{inr(sellTotal)}</span>
                  </div>
                )}

                {sellQuantity > ownedQuantity && (
                  <p className="text-sm text-amber-400">⚠️ Cannot sell more than you own</p>
                )}

                {sellMessage && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {sellMessage}
                  </div>
                )}
                {sellError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {sellError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full"
                  disabled={sellLoading || !sellQuantity || sellQuantity > ownedQuantity || ownedQuantity === 0}
                >
                  {sellLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Sell {sellQuantity || 0} Shares</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          </StaggerItem>
        </Stagger>
      )}

      {!selectedStock && (
        <Reveal>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <LineChart className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Select a stock from the dropdown above to start trading.</p>
          </CardContent>
        </Card>
        </Reveal>
      )}
    </div>
  );
}

export default Trade;

import { useState } from 'react';
import { Search, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import StockChart from './StockChart';
import PredictionCard from './ai/PredictionCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { cn } from '../lib/utils';

const POPULAR = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'SBIN'];

function StockSearch() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }
    setLoading(true);
    setError('');
    setSearchResult(null);
    try {
      const response = await api.get(`/stocks?q=${searchSymbol.trim()}`);
      if (response.data.success && response.data.data.length > 0) {
        const stock = response.data.data[0];
        setSearchResult({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.currentPrice,
          change: 0,
          changePercent: 0,
          volume: stock.volume || 0,
          exchange: 'NSE',
        });
      } else {
        setError(`Stock "${searchSymbol}" not found. Try RELIANCE, TCS, INFY, HDFC, etc.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to search stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!searchResult) return;
    setRefreshing(true);
    try {
      const response = await api.get(`/stocks/${searchResult.id}/price`);
      if (response.data.success) {
        setSearchResult((prev) => ({ ...prev, currentPrice: response.data.data.currentPrice }));
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh price');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClear = () => {
    setSearchSymbol('');
    setSearchResult(null);
    setError('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Indian Stocks</CardTitle>
        <CardDescription>Search NSE/BSE stocks and view real-time prices</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input
            type="text"
            placeholder="Enter symbol (e.g., RELIANCE, TCS, INFY)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
            disabled={loading}
            className="min-w-[12rem] flex-1"
          />
          <Button type="submit" disabled={loading || !searchSymbol.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
          {searchResult && (
            <Button type="button" variant="outline" onClick={handleClear} disabled={loading}>
              Clear
            </Button>
          )}
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {searchResult && (
          <div className="mt-4 rounded-lg border border-border bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{searchResult.symbol}</h3>
                <p className="text-sm text-muted-foreground">{searchResult.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Badge variant="secondary">{searchResult.exchange}</Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Price</div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  ₹{searchResult.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                Volume:{' '}
                <span className="tabular-nums text-foreground">
                  {searchResult.volume ? searchResult.volume.toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>

            <StockChart symbol={searchResult.symbol} />

            <div className="mt-4">
              <PredictionCard symbol={searchResult.symbol} />
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs text-muted-foreground">Popular stocks:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((symbol) => (
              <button
                key={symbol}
                onClick={() => {
                  setSearchSymbol(symbol);
                  setError('');
                }}
                disabled={loading}
                className="rounded-md border border-border bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StockSearch;

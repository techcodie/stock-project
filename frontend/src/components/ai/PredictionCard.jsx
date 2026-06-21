import { useCallback, useEffect, useState } from 'react';
import { motion as Motion } from 'motion/react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

// Friendly labels for the model's technical-indicator features.
const FEATURE_LABELS = {
  return_1d: "Yesterday's return",
  return_5d: '1-week momentum',
  sma_ratio_10: 'Price vs 10-day avg',
  sma_ratio_20: 'Price vs 20-day avg',
  rsi_14: 'RSI (14)',
  macd_diff: 'MACD signal',
  volatility_10: '10-day volatility',
  momentum_10: '10-day momentum',
  volume_ratio: 'Volume vs average',
};

function confidenceLabel(c) {
  if (c >= 0.3) return 'High';
  if (c >= 0.12) return 'Medium';
  return 'Low';
}

export default function PredictionCard({ symbol }) {
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPrediction = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    try {
      const r = await api.get(`/ai/predict/${symbol}`);
      if (r.data.success) setPred(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction unavailable.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  const header = (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Brain className="h-4 w-4" />
        </span>
        AI Price Prediction
        <Badge variant="outline" className="ml-auto text-[10px]">
          ML model
        </Badge>
      </CardTitle>
    </CardHeader>
  );

  if (loading) {
    return (
      <Card>
        {header}
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Running the model…
        </CardContent>
      </Card>
    );
  }

  if (error || !pred) {
    return (
      <Card>
        {header}
        <CardContent className="flex items-start gap-2 py-5 text-sm text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error || 'No prediction available.'}</span>
        </CardContent>
      </Card>
    );
  }

  const up = pred.direction === 'UP';
  const probPct = Math.round(pred.probabilityUp * 100);

  return (
    <Card>
      {header}
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {up ? (
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-400" />
            )}
            <div>
              <div className={cn('text-xl font-bold', up ? 'text-emerald-400' : 'text-red-400')}>
                {up ? 'Likely Up' : 'Likely Down'}
              </div>
              <div className="text-xs text-muted-foreground">next trading day · {pred.symbol}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-foreground">{probPct}%</div>
            <div className="text-xs text-muted-foreground">prob. up</div>
          </div>
        </div>

        {/* Probability bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <Motion.div
            className={cn('h-full rounded-full', up ? 'bg-emerald-500' : 'bg-red-500')}
            initial={{ width: 0 }}
            animate={{ width: `${probPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Confidence:{' '}
            <span className="font-medium text-foreground">{confidenceLabel(pred.confidence)}</span>
          </span>
          <span className="text-muted-foreground">
            Model accuracy:{' '}
            <span className="font-medium text-foreground">
              {Math.round((pred.modelAccuracy || 0) * 100)}%
            </span>
          </span>
        </div>

        {/* What drove the prediction */}
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Top signals
          </div>
          <div className="space-y-1.5">
            {pred.topSignals?.map((s) => (
              <div key={s.feature} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{FEATURE_LABELS[s.feature] || s.feature}</span>
                <span className="tabular-nums text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          {pred.model} · trained on {pred.dataSource} data · {pred.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}

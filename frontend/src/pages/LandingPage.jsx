import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Rocket,
  Wallet,
  BarChart3,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Reveal, Stagger, StaggerItem } from '../components/ui/motion';

const FEATURES = [
  {
    icon: Wallet,
    title: 'Virtual Trading',
    desc: 'Start with ₹10,00,000 virtual money. Practice buying and selling without any real financial risk.',
  },
  {
    icon: BarChart3,
    title: 'Live Market Prices',
    desc: 'Realistic market conditions with prices that fluctuate every few seconds, just like real markets.',
  },
  {
    icon: Briefcase,
    title: 'Portfolio Tracking',
    desc: 'Monitor investments with real-time profit/loss calculations and a clean portfolio overview.',
  },
  {
    icon: Sparkles,
    title: 'AI Research',
    desc: 'Upload a financial PDF and ask grounded questions — every answer cites the exact source passages.',
  },
];

const STATS = [
  { value: '₹10L', label: 'Starting Balance' },
  { value: '12+', label: 'Popular Stocks' },
  { value: 'Live', label: 'Price Updates' },
  { value: 'RAG', label: 'AI Document Q&A' },
];

function LandingPage() {
  const navigate = useNavigate();

  // One-tap demo login so reviewers can jump straight into a populated app.
  const handleDemoLogin = async () => {
    try {
      const response = await api.post('/auth/login', {
        email: 'demo@demo.com',
        password: 'demo123',
      });
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Demo login failed:', err);
      navigate('/login');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative flex flex-col items-center py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-8 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]"
        />
        <Reveal delay={0}>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Virtual trading + AI research
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Master the art of{' '}
            <span className="animate-gradient-text bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 bg-clip-text text-transparent">
              stock trading
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Practice trading with ₹10,00,000 of virtual capital, then research the companies behind
            your trades with an AI that reads financial PDFs and cites its sources.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={handleDemoLogin}>
              <Rocket className="h-4 w-4" />
              View Live Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/signup">
              <Button size="lg" variant="outline">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost">
                Sign In
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.32} className="w-full">
          <div className="mx-auto mt-16 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card px-4 py-5 backdrop-blur-xl">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Why choose StockTrader?
        </h2>
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <StaggerItem key={title} lift>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white/5 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="py-12">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to start trading?
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Jump into a fully populated demo account — no signup required.
            </p>
            <Button size="lg" onClick={handleDemoLogin}>
              <Rocket className="h-4 w-4" />
              Launch Demo
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 StockTrader. Built for learning and practice.
      </footer>
    </div>
  );
}

export default LandingPage;

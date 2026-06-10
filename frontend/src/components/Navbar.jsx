import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion } from 'motion/react';
import {
  TrendingUp,
  LayoutDashboard,
  ArrowLeftRight,
  Briefcase,
  Receipt,
  Sparkles,
  Wallet,
  LogOut,
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trade', label: 'Trade', icon: ArrowLeftRight },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/ai-research', label: 'AI Research', icon: Sparkles },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  // Read the token on every render. Changing routes re-renders this component
  // (because useLocation() updates), so the login state stays in sync.
  const isLoggedIn = !!localStorage.getItem('token');

  const [balance, setBalance] = useState(null);

  // Keep a live wallet balance in the navbar for logged-in users. Refetches on
  // route changes (e.g. after a trade) and every 15s.
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    const load = () =>
      api
        .get('/wallet/balance')
        .then((r) => {
          if (active && r.data?.success) setBalance(r.data.data.balance);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isLoggedIn, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const Brand = (
    <Link
      to={isLoggedIn ? '/dashboard' : '/'}
      className="flex items-center gap-2.5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
        <TrendingUp className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Stock<span className="text-primary">Trader</span>
      </span>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-black/60 backdrop-blur-xl">
      {/* subtle emerald glow line under the bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {Brand}

        {isLoggedIn ? (
          <>
            <div className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className="relative flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
                  >
                    {active && (
                      <Motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span
                      className={cn(
                        'relative z-10 flex items-center gap-1.5',
                        active ? 'text-emerald-300' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {balance !== null && (
                <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 sm:flex">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
            <Button size="sm" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        )}
      </div>

      {/* Compact nav for small screens */}
      {isLoggedIn && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default Navbar;

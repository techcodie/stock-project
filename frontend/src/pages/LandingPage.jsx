import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Master the Art of
                        <span className="gradient-text"> Stock Trading</span>
                    </h1>
                    <p className="hero-description">
                        Practice trading with ₹10,00,000 virtual money. Learn the markets,
                        build your portfolio, and develop winning strategies — all without risking real money.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/signup" className="btn-hero-primary">
                            Get Started Free
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link to="/login" className="btn-hero-secondary">
                            Sign In
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">₹10L</span>
                            <span className="stat-label">Starting Balance</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">12+</span>
                            <span className="stat-label">Popular Stocks</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">Live</span>
                            <span className="stat-label">Price Updates</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Why Choose StockTrader?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h3>Virtual Trading</h3>
                        <p>Start with ₹10,00,000 virtual money. Practice buying and selling stocks without any real financial risk.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="M18 17V9" />
                                <path d="M13 17V5" />
                                <path d="M8 17v-3" />
                            </svg>
                        </div>
                        <h3>Live Market Prices</h3>
                        <p>Experience realistic market conditions with prices that fluctuate every few seconds, just like real markets.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                            </svg>
                        </div>
                        <h3>Portfolio Tracking</h3>
                        <p>Monitor your investments with real-time profit/loss calculations and comprehensive portfolio analytics.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                                <path d="M10 9H8" />
                            </svg>
                        </div>
                        <h3>Transaction History</h3>
                        <p>Keep track of every trade with detailed transaction logs showing buy/sell history and timestamps.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Start Trading?</h2>
                    <p>Join thousands of traders learning the markets with StockTrader</p>
                    <Link to="/signup" className="btn-cta">
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© 2026 StockTrader. Built for learning and practice.</p>
            </footer>
        </div>
    );
}

export default LandingPage;

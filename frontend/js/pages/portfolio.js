// Portfolio page
class PortfolioPage {
    static async render() {
        if (!AuthService.requireAuth()) return;

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="portfolio-container">
                <div class="portfolio-header">
                    <h2>My Portfolio</h2>
                    <div class="wallet-section">
                        <div class="wallet-balance">
                            <span class="balance-label">Available Balance:</span>
                            <span class="balance-amount" id="wallet-balance">₹0.00</span>
                        </div>
                    </div>
                </div>

                <div id="portfolio-loading" class="loading-message">Loading portfolio...</div>
                <div id="portfolio-error" class="message error hidden"></div>
                
                <div id="empty-portfolio" class="empty-portfolio hidden">
                    <h3>Your Portfolio is Empty</h3>
                    <p>You haven't bought any stocks yet. Visit the Trade page to start investing!</p>
                </div>

                <div id="portfolio-content" class="hidden">
                    <div class="table-container">
                        <table class="portfolio-table">
                            <thead>
                                <tr>
                                    <th>Stock Symbol</th>
                                    <th>Company Name</th>
                                    <th>Quantity</th>
                                    <th>Avg. Buy Price</th>
                                    <th>Current Price</th>
                                    <th>Total Value</th>
                                    <th>P&L</th>
                                </tr>
                            </thead>
                            <tbody id="portfolio-tbody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.loadPortfolio();
    }

    static async loadPortfolio() {
        const loadingDiv = document.getElementById('portfolio-loading');
        const errorDiv = document.getElementById('portfolio-error');
        const emptyDiv = document.getElementById('empty-portfolio');
        const contentDiv = document.getElementById('portfolio-content');
        const tbody = document.getElementById('portfolio-tbody');

        try {
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            emptyDiv.classList.add('hidden');
            contentDiv.classList.add('hidden');

            // Load portfolio and wallet balance
            const [portfolioResponse, walletResponse] = await Promise.all([
                api.get('/portfolio'),
                api.get('/wallet/balance')
            ]);

            if (walletResponse.success) {
                document.getElementById('wallet-balance').textContent = 
                    this.formatCurrency(walletResponse.data.balance || 0);
            }

            if (portfolioResponse.success) {
                const portfolio = portfolioResponse.data || [];
                
                if (portfolio.length === 0) {
                    loadingDiv.classList.add('hidden');
                    emptyDiv.classList.remove('hidden');
                } else {
                    tbody.innerHTML = portfolio.map(holding => {
                        const totalValue = holding.quantity * (holding.stock.currentPrice || 0);
                        const totalCost = holding.quantity * holding.averagePrice;
                        const pnl = totalValue - totalCost;
                        const pnlClass = pnl >= 0 ? 'profit' : 'loss';

                        return `
                            <tr>
                                <td><strong>${holding.stock.symbol}</strong></td>
                                <td>${holding.stock.name}</td>
                                <td>${holding.quantity}</td>
                                <td>${this.formatCurrency(holding.averagePrice)}</td>
                                <td class="current-price">${this.formatCurrency(holding.stock.currentPrice || 0)}</td>
                                <td>${this.formatCurrency(totalValue)}</td>
                                <td class="${pnlClass}">${this.formatCurrency(pnl)}</td>
                            </tr>
                        `;
                    }).join('');

                    loadingDiv.classList.add('hidden');
                    contentDiv.classList.remove('hidden');
                }
            } else {
                throw new Error(portfolioResponse.message || 'Failed to load portfolio');
            }
        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = error.message || 'Failed to load portfolio';
            errorDiv.classList.remove('hidden');
        }
    }

    static formatCurrency(value) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
}

window.PortfolioPage = PortfolioPage;
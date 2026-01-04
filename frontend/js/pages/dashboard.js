// Dashboard page
class DashboardPage {
    static refreshInterval = null;

    static async render() {
        console.log('Dashboard render called');

        try {
            if (!AuthService.requireAuth()) {
                console.log('Auth required, redirecting');
                return;
            }

            console.log('Rendering dashboard HTML');
            const mainContent = document.getElementById('main-content');

            if (!mainContent) {
                console.error('main-content element not found');
                return;
            }

            // Render initial structure immediately
            mainContent.innerHTML = `
                <div class="dashboard-container">
                    <div class="dashboard-content">
                        
                        <div class="stocks-section">
                            <div class="section-header">
                                <h3>My Dashboard</h3>
                            </div>
                            
                            <!-- Stock Search Section -->
                            <div class="search-section">
                                <h4>Add Stock to Dashboard</h4>
                                <div class="search-form">
                                    <div class="search-input-group">
                                        <input type="text" id="stock-search-input" placeholder="Enter stock symbol (e.g., TCS, RELIANCE)" maxlength="10">
                                        <button onclick="DashboardPage.addStock()" class="btn-search">Add Stock</button>
                                    </div>
                                </div>
                                <div id="search-message"></div>
                            </div>
                            
                            <div id="stocks-loading" class="loading-message">Loading stocks...</div>
                            <div id="stocks-error" class="message error hidden"></div>
                            <div id="stocks-content" class="hidden">
                                <div class="stocks-table-container">
                                    <table class="stocks-table">
                                        <thead>
                                            <tr>
                                                <th>Symbol</th>
                                                <th>Company Name</th>
                                                <th>Current Price</th>
                                                <th>Change %</th>
                                                <th>Last Updated</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody id="stocks-tbody">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            console.log('Dashboard HTML rendered, loading stocks...');
            await this.loadStocks();
            this.startAutoRefresh();
        } catch (error) {
            console.error('CRITICAL ERROR in Dashboard.render:', error);
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: red;">
                        <h2>Error Loading Dashboard</h2>
                        <p>${error.message}</p>
                        <p>Check console for details.</p>
                        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">Reload Page</button>
                    </div>
                `;
            }
        }
    }

    static async loadStocks(silent = false) {
        const loadingDiv = document.getElementById('stocks-loading');
        const errorDiv = document.getElementById('stocks-error');
        const contentDiv = document.getElementById('stocks-content');
        const tbody = document.getElementById('stocks-tbody');

        // Ensure DOM elements exist before proceeding
        if (!loadingDiv || !errorDiv || !contentDiv || !tbody) {
            console.error('Dashboard DOM elements not found');
            return;
        }

        try {
            if (!silent) {
                loadingDiv.classList.remove('hidden');
                errorDiv.classList.add('hidden');
                contentDiv.classList.add('hidden');
            }

            console.log('Loading stocks...');

            // Try watchlist first, fallback to all stocks
            let response;
            try {
                response = await api.get('/watchlist');
                console.log('Watchlist response:', response);
            } catch (watchlistError) {
                console.log('Watchlist failed, trying stocks:', watchlistError);
                response = await api.get('/stocks');
                console.log('Stocks response:', response);
            }

            // Always show content div, even if empty
            if (!silent) {
                loadingDiv.classList.add('hidden');
                contentDiv.classList.remove('hidden');
            }

            if (response && response.success) {
                const stocks = response.data || [];

                if (stocks.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                                No stocks available. Use the search above to add stocks.
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = stocks.map(stock => {
                        const changePercent = stock.changePercent || 0;
                        const changeClass = changePercent >= 0 ? 'profit' : 'loss';
                        const changeSign = changePercent >= 0 ? '+' : '';
                        const lastUpdated = new Date().toLocaleTimeString();

                        return `
                            <tr class="stock-row" data-symbol="${stock.symbol}">
                                <td><strong>${stock.symbol || 'N/A'}</strong></td>
                                <td>${stock.name || 'N/A'}</td>
                                <td class="stock-price">${this.formatCurrency(stock.currentPrice || 0)}</td>
                                <td class="${changeClass}">${changeSign}${changePercent.toFixed(2)}%</td>
                                <td class="last-updated">${lastUpdated}</td>
                                <td>
                                    <button onclick="DashboardPage.removeStock('${stock.id}')" class="btn-remove">
                                        ✖ Remove
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');

                    // Add visual feedback for updates
                    if (silent) {
                        this.highlightUpdatedRows();
                    }
                }
            } else {
                // Show empty state instead of error
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                            Unable to load stocks. Please try refreshing the page.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            if (!silent) {
                loadingDiv.classList.add('hidden');
                contentDiv.classList.remove('hidden');
            }

            // Show user-friendly message instead of breaking
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #e74c3c;">
                        Failed to load dashboard. Please check your connection and try again.
                        <br><button onclick="DashboardPage.refreshStocks()" style="margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }

    static async refreshStocks() {
        await this.loadStocks(false);
    }

    static startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(async () => {
            await this.loadStocks(true); // Silent refresh
        }, 5000); // Refresh every 5 seconds
    }

    static stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }



    static highlightUpdatedRows() {
        const rows = document.querySelectorAll('.stock-row');
        rows.forEach(row => {
            row.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 1000);
        });
    }

    static async addStock() {
        const input = document.getElementById('stock-search-input');
        const messageDiv = document.getElementById('search-message');
        const symbol = input.value.trim().toUpperCase();

        if (!symbol) {
            messageDiv.innerHTML = '<div class="message error">Please enter a stock symbol</div>';
            return;
        }

        messageDiv.innerHTML = '';

        try {
            const response = await api.post('/watchlist', { symbol });

            if (response.success) {
                messageDiv.innerHTML = '<div class="message success">Stock added to dashboard successfully</div>';
                input.value = '';
                await this.loadStocks();

                // Clear success message after 3 seconds
                setTimeout(() => {
                    messageDiv.innerHTML = '';
                }, 3000);
            } else {
                messageDiv.innerHTML = `<div class="message error">${response.message}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = '<div class="message error">Failed to add stock. Please try again.</div>';
        }
    }

    static async removeStock(stockId) {
        if (!confirm('Are you sure you want to remove this stock from your dashboard?')) {
            return;
        }

        try {
            const response = await api.delete(`/watchlist/${stockId}`);

            if (response.success) {
                await this.loadStocks();
            } else {
                alert('Failed to remove stock: ' + response.message);
            }
        } catch (error) {
            alert('Failed to remove stock. Please try again.');
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

    // Cleanup when leaving the page
    static cleanup() {
        this.stopAutoRefresh();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    DashboardPage.cleanup();
});

window.DashboardPage = DashboardPage;
console.log('DashboardPage class loaded successfully');
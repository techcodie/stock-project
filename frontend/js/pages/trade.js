// Trade page
class TradePage {
    static async render() {
        if (!AuthService.requireAuth()) return;

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="trade-container">
                <div class="trade-header">
                    <h2>Trade Stocks</h2>
                    <div class="wallet-info">
                        <div class="wallet-balance">
                            <span class="balance-label">Available Balance:</span>
                            <span class="balance-amount" id="wallet-balance">₹0.00</span>
                        </div>
                    </div>
                </div>

                <div id="trade-loading" class="loading-message">Loading...</div>
                <div id="trade-error" class="message error hidden"></div>
                
                <div id="trade-content" class="hidden">
                    <div class="trade-sections">
                        <div class="trade-section buy-section">
                            <h3>Buy Stock</h3>
                            <form id="buy-form" class="trade-form">
                                <div class="form-group">
                                    <label for="buy-stockId">Select Stock</label>
                                    <select id="buy-stockId" name="stockId" required>
                                        <option value="">Choose a stock...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="buy-quantity">Quantity</label>
                                    <input type="number" id="buy-quantity" name="quantity" min="1" required>
                                </div>
                                
                                <div id="buy-calculation" class="total-calculation hidden">
                                    <div class="calculation-row">
                                        <span>Price per share:</span>
                                        <span class="price-value" id="buy-price">₹0.00</span>
                                    </div>
                                    <div class="calculation-row total-row">
                                        <span>Total Amount:</span>
                                        <span class="total-value" id="buy-total">₹0.00</span>
                                    </div>
                                </div>
                                
                                <div id="buy-message"></div>
                                <button type="submit" class="btn-primary btn-buy">Buy Stock</button>
                            </form>
                        </div>

                        <div class="trade-section sell-section">
                            <h3>Sell Stock</h3>
                            <form id="sell-form" class="trade-form">
                                <div class="form-group">
                                    <label for="sell-stockId">Select Stock</label>
                                    <select id="sell-stockId" name="stockId" required>
                                        <option value="">Choose a stock...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sell-quantity">Quantity</label>
                                    <input type="number" id="sell-quantity" name="quantity" min="1" required>
                                </div>
                                
                                <div id="sell-calculation" class="total-calculation hidden">
                                    <div class="calculation-row">
                                        <span>Price per share:</span>
                                        <span class="price-value" id="sell-price">₹0.00</span>
                                    </div>
                                    <div class="calculation-row total-row">
                                        <span>Total Amount:</span>
                                        <span class="total-value" id="sell-total">₹0.00</span>
                                    </div>
                                </div>
                                
                                <div id="sell-message"></div>
                                <button type="submit" class="btn-primary btn-sell">Sell Stock</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
    }

    static async loadData() {
        const loadingDiv = document.getElementById('trade-loading');
        const errorDiv = document.getElementById('trade-error');
        const contentDiv = document.getElementById('trade-content');

        try {
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            contentDiv.classList.add('hidden');

            // Load stocks and wallet balance
            const [stocksResponse, walletResponse] = await Promise.all([
                api.get('/stocks'),
                api.get('/wallet/balance')
            ]);

            if (stocksResponse.success) {
                this.populateStockSelects(stocksResponse.data || []);
            }

            if (walletResponse.success) {
                document.getElementById('wallet-balance').textContent = 
                    this.formatCurrency(walletResponse.data.balance || 0);
                this.walletBalance = walletResponse.data.balance || 0;
            }

            loadingDiv.classList.add('hidden');
            contentDiv.classList.remove('hidden');
        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = 'Failed to load trading data';
            errorDiv.classList.remove('hidden');
        }
    }

    static populateStockSelects(stocks) {
        const buySelect = document.getElementById('buy-stockId');
        const sellSelect = document.getElementById('sell-stockId');
        
        const options = stocks.map(stock => 
            `<option value="${stock.id}">${stock.symbol} - ${stock.name}</option>`
        ).join('');

        buySelect.innerHTML = '<option value="">Choose a stock...</option>' + options;
        sellSelect.innerHTML = '<option value="">Choose a stock...</option>' + options;
        
        this.stocks = stocks;
    }

    static attachEventListeners() {
        // Buy form listeners
        const buyForm = document.getElementById('buy-form');
        const buyStockSelect = document.getElementById('buy-stockId');
        const buyQuantityInput = document.getElementById('buy-quantity');

        buyStockSelect.addEventListener('change', () => this.updateBuyCalculation());
        buyQuantityInput.addEventListener('input', () => this.updateBuyCalculation());

        buyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleBuySubmit(e);
        });

        // Sell form listeners
        const sellForm = document.getElementById('sell-form');
        const sellStockSelect = document.getElementById('sell-stockId');
        const sellQuantityInput = document.getElementById('sell-quantity');

        sellStockSelect.addEventListener('change', () => this.updateSellCalculation());
        sellQuantityInput.addEventListener('input', () => this.updateSellCalculation());

        sellForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSellSubmit(e);
        });
    }

    static updateBuyCalculation() {
        const stockId = document.getElementById('buy-stockId').value;
        const quantity = parseInt(document.getElementById('buy-quantity').value) || 0;
        const calculationDiv = document.getElementById('buy-calculation');
        const priceSpan = document.getElementById('buy-price');
        const totalSpan = document.getElementById('buy-total');

        if (stockId && quantity > 0) {
            const stock = this.stocks.find(s => s.id === stockId);
            if (stock) {
                const price = stock.currentPrice || 0;
                const total = quantity * price;

                priceSpan.textContent = this.formatCurrency(price);
                totalSpan.textContent = this.formatCurrency(total);
                calculationDiv.classList.remove('hidden');

                // Check if user has sufficient balance
                const buyButton = document.querySelector('.btn-buy');
                if (total > this.walletBalance) {
                    buyButton.disabled = true;
                    buyButton.textContent = 'Insufficient Balance';
                } else {
                    buyButton.disabled = false;
                    buyButton.textContent = 'Buy Stock';
                }
            }
        } else {
            calculationDiv.classList.add('hidden');
        }
    }

    static updateSellCalculation() {
        const stockId = document.getElementById('sell-stockId').value;
        const quantity = parseInt(document.getElementById('sell-quantity').value) || 0;
        const calculationDiv = document.getElementById('sell-calculation');
        const priceSpan = document.getElementById('sell-price');
        const totalSpan = document.getElementById('sell-total');

        if (stockId && quantity > 0) {
            const stock = this.stocks.find(s => s.id === stockId);
            if (stock) {
                const price = stock.currentPrice || 0;
                const total = quantity * price;

                priceSpan.textContent = this.formatCurrency(price);
                totalSpan.textContent = this.formatCurrency(total);
                calculationDiv.classList.remove('hidden');
            }
        } else {
            calculationDiv.classList.add('hidden');
        }
    }

    static async handleBuySubmit(e) {
        const messageDiv = document.getElementById('buy-message');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        messageDiv.innerHTML = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
            const formData = new FormData(e.target);
            const data = {
                stockId: formData.get('stockId'),
                quantity: parseInt(formData.get('quantity'))
            };

            const response = await api.post('/trade/buy', data);

            if (response.success) {
                messageDiv.innerHTML = `<div class="message success">${response.message}</div>`;
                e.target.reset();
                document.getElementById('buy-calculation').classList.add('hidden');
                
                // Update wallet balance
                if (response.data && response.data.walletBalance !== undefined) {
                    this.walletBalance = response.data.walletBalance;
                    document.getElementById('wallet-balance').textContent = 
                        this.formatCurrency(this.walletBalance);
                }
            } else {
                messageDiv.innerHTML = `<div class="message error">${response.message}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div class="message error">Failed to buy stock. Please try again.</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Buy Stock';
        }
    }

    static async handleSellSubmit(e) {
        const messageDiv = document.getElementById('sell-message');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        messageDiv.innerHTML = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
            const formData = new FormData(e.target);
            const data = {
                stockId: formData.get('stockId'),
                quantity: parseInt(formData.get('quantity'))
            };

            const response = await api.post('/trade/sell', data);

            if (response.success) {
                messageDiv.innerHTML = `<div class="message success">${response.message}</div>`;
                e.target.reset();
                document.getElementById('sell-calculation').classList.add('hidden');
                
                // Update wallet balance
                if (response.data && response.data.walletBalance !== undefined) {
                    this.walletBalance = response.data.walletBalance;
                    document.getElementById('wallet-balance').textContent = 
                        this.formatCurrency(this.walletBalance);
                }
            } else {
                messageDiv.innerHTML = `<div class="message error">${response.message}</div>`;
            }
        } catch (error) {
            messageDiv.innerHTML = `<div class="message error">Failed to sell stock. Please try again.</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Sell Stock';
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

window.TradePage = TradePage;
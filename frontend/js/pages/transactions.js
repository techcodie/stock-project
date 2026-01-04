// Transactions page
class TransactionsPage {
    static async render() {
        if (!AuthService.requireAuth()) return;

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="transactions-container">
                <h2>Transaction History</h2>

                <div id="transactions-loading" class="loading-message">Loading transactions...</div>
                <div id="transactions-error" class="message error hidden"></div>
                
                <div id="empty-transactions" class="empty-transactions hidden">
                    <h3>No Transactions Yet</h3>
                    <p>You haven't made any trades yet. Visit the Trade page to start buying and selling stocks!</p>
                </div>

                <div id="transactions-content" class="hidden">
                    <div class="table-container">
                        <table class="transactions-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Type</th>
                                    <th>Stock Symbol</th>
                                    <th>Company Name</th>
                                    <th>Quantity</th>
                                    <th>Price per Share</th>
                                    <th>Total Amount</th>
                                </tr>
                            </thead>
                            <tbody id="transactions-tbody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await this.loadTransactions();
    }

    static async loadTransactions() {
        const loadingDiv = document.getElementById('transactions-loading');
        const errorDiv = document.getElementById('transactions-error');
        const emptyDiv = document.getElementById('empty-transactions');
        const contentDiv = document.getElementById('transactions-content');
        const tbody = document.getElementById('transactions-tbody');

        try {
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            emptyDiv.classList.add('hidden');
            contentDiv.classList.add('hidden');

            const response = await api.get('/transactions');

            if (response.success) {
                const transactions = response.data || [];
                
                if (transactions.length === 0) {
                    loadingDiv.classList.add('hidden');
                    emptyDiv.classList.remove('hidden');
                } else {
                    tbody.innerHTML = transactions.map(transaction => {
                        const date = new Date(transaction.createdAt).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const typeClass = transaction.type === 'BUY' ? 'type-buy' : 'type-sell';
                        const totalAmount = transaction.quantity * transaction.price;

                        return `
                            <tr>
                                <td>${date}</td>
                                <td><span class="${typeClass}">${transaction.type}</span></td>
                                <td><strong>${transaction.stock.symbol}</strong></td>
                                <td>${transaction.stock.name}</td>
                                <td>${transaction.quantity}</td>
                                <td>${this.formatCurrency(transaction.price)}</td>
                                <td>${this.formatCurrency(totalAmount)}</td>
                            </tr>
                        `;
                    }).join('');

                    loadingDiv.classList.add('hidden');
                    contentDiv.classList.remove('hidden');
                }
            } else {
                throw new Error(response.message || 'Failed to load transactions');
            }
        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = error.message || 'Failed to load transactions';
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

window.TransactionsPage = TransactionsPage;
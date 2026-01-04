// API Service for HTTP requests
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Check if response is ok (status 200-299)
            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} ${response.statusText}`);
                // Try to get error message from response
                try {
                    const errorData = await response.json();
                    return { success: false, message: errorData.message || `HTTP ${response.status}` };
                } catch {
                    return { success: false, message: `HTTP ${response.status}` };
                }
            }
            
            const data = await response.json();
            console.log(`API ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return { success: false, message: 'Network error' };
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create global API instance
window.api = new ApiService();
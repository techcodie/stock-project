// Login page
class LoginPage {
    static render() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="form-container">
                <h2>Login</h2>
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div id="login-message"></div>
                    <button type="submit" class="btn-primary">Login</button>
                </form>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        const form = document.getElementById('login-form');
        const messageDiv = document.getElementById('login-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.innerHTML = '';

            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const response = await api.post('/auth/login', data);
                console.log('Login response:', response);
                
                // Check for success in multiple ways
                if (response && (response.success === true || response.success === 'true') && response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    console.log('Login successful, redirecting...');
                    router.navigate('/');
                } else {
                    console.log('Login failed:', response);
                    messageDiv.innerHTML = `<div class="message error">${response?.message || 'Login failed'}</div>`;
                }
            } catch (error) {
                console.error('Login error:', error);
                messageDiv.innerHTML = `<div class="message error">Login failed. Please check your credentials.</div>`;
            }
        });
    }
}

window.LoginPage = LoginPage;
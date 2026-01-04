// Signup page
class SignupPage {
    static render() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="form-container">
                <h2>Sign Up</h2>
                <form id="signup-form" class="auth-form">
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div id="signup-message"></div>
                    <button type="submit" class="btn-primary">Sign Up</button>
                </form>
            </div>
        `;

        this.attachEventListeners();
    }

    static attachEventListeners() {
        const form = document.getElementById('signup-form');
        const messageDiv = document.getElementById('signup-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.innerHTML = '';

            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const response = await api.post('/auth/signup', data);
                
                if (response.success) {
                    messageDiv.innerHTML = `<div class="message success">${response.message}</div>`;
                    setTimeout(() => {
                        router.navigate('/login');
                    }, 2000);
                } else {
                    messageDiv.innerHTML = `<div class="message error">${response.message || 'Signup failed'}</div>`;
                }
            } catch (error) {
                messageDiv.innerHTML = `<div class="message error">Signup failed. Please try again.</div>`;
            }
        });
    }
}

window.SignupPage = SignupPage;
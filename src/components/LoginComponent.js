/**
 * Login Component for Lockré
 * Handles user authentication with role-based access
 */

class LoginComponent {
    constructor() {
        this.db = new DatabaseManager();
        this.init();
    }

    async init() {
        await this.db.init();
        this.createDefaultAdmin();
    }

    async createDefaultAdmin() {
        // Create default admin user if none exists
        const users = await this.db.getAllUsers();
        if (users.length === 0) {
            const defaultAdmin = {
                username: 'admin',
                password: this.hashPassword('admin123'),
                role: 'admin',
                fullName: 'Administrateur',
                createdAt: new Date().toISOString()
            };
            await this.db.createUser(defaultAdmin);
            console.log('Default admin created: admin/admin123');
        }
    }

    hashPassword(password) {
        // Simple hash for demo - use proper encryption in production
        return btoa(password);
    }

    render() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <div class="login-header">
                        <div class="logo">
                            <i class="fas fa-lock"></i>
                            <span>Lockré</span>
                        </div>
                        <h2>Connexion au système</h2>
                        <p>Gestion des ventes moderne et intuitive</p>
                    </div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">Nom d'utilisateur</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Mot de passe</label>
                            <input type="password" id="password" name="password" required>
                            <button type="button" class="toggle-password" onclick="togglePassword()">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <label for="role">Type de connexion</label>
                            <select id="role" name="role" required>
                                <option value="">Sélectionner un rôle</option>
                                <option value="admin">Administrateur</option>
                                <option value="vendor">Vendeur</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="login-btn">
                            <i class="fas fa-sign-in-alt"></i>
                            Se connecter
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <p>Première utilisation ? Contactez l'administrateur</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            const user = await this.db.getUser(username);
            
            if (user && user.password === this.hashPassword(password) && user.role === role) {
                // Store user session
                localStorage.setItem('lockre_current_user', JSON.stringify({
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.fullName
                }));
                
                // Redirect to appropriate dashboard
                window.location.reload();
            } else {
                this.showError('Identifiants incorrects ou rôle invalide');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Erreur de connexion. Veuillez réessayer.');
        }
    }

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;
        
        const form = document.getElementById('loginForm');
        form.insertBefore(errorDiv, form.firstChild);
    }
}

// Global function for password toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const icon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

/**
 * Setup Component for Lockré
 * Initial admin account creation screen with business setup
 */

class SetupComponent {
    constructor() {
        this.db = new DatabaseManager();
        this.init();
    }

    async init() {
        await this.db.init();
        this.checkIfSetupNeeded();
    }

    async checkIfSetupNeeded() {
        const users = await this.db.getAllUsers();
        if (users.length > 0) {
            // Admin already exists, redirect to login
            const login = new LoginComponent();
            login.render();
            return;
        }
        
        // No admin exists, show setup screen
        this.render();
    }

    render() {
        document.body.innerHTML = `
            <div class="setup-container">
                <div class="setup-form">
                    <div class="setup-header">
                        <div class="logo">
                            <i class="fas fa-lock"></i>
                            <span>Lockré</span>
                        </div>
                        <h2>Configuration initiale</h2>
                        <p>Créez votre compte administrateur et configurez votre boutique</p>
                    </div>
                    
                    <form id="setupForm">
                        <div class="form-group">
                            <label for="shopName">Nom de la boutique</label>
                            <input type="text" id="shopName" name="shopName" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="fullName">Nom complet de l'administrateur</label>
                            <input type="text" id="fullName" name="fullName" required>
                        </div>
                        
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
                            <label for="confirmPassword">Confirmer le mot de passe</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                        </div>
                        
                        <button type="submit" class="setup-btn">
                            <i class="fas fa-user-plus"></i>
                            Créer le compte administrateur
                        </button>
                    </form>
                    
                    <div class="setup-footer">
                        <p>Cette étape est nécessaire pour la première utilisation</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('setupForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSetup();
        });
    }

    async handleSetup() {
        const shopName = document.getElementById('shopName').value;
        const fullName = document.getElementById('fullName').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (password !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            this.showError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (!shopName.trim()) {
            this.showError('Le nom de la boutique est requis');
            return;
        }

        try {
            // Create admin user
            const adminUser = {
                username: username,
                password: this.hashPassword(password),
                role: 'admin',
                fullName: fullName,
                shopName: shopName,
                createdAt: new Date().toISOString()
            };

            await this.db.createUser(adminUser);
            
            // Store shop settings
            await this.db.setSetting('shopName', shopName);
            await this.db.setSetting('setupComplete', 'true');
            
            // Show success message and redirect
            this.showSuccess('Compte administrateur créé avec succès !');
            setTimeout(() => {
                const login = new LoginComponent();
                login.render();
            }, 2000);

        } catch (error) {
            console.error('Setup error:', error);
            this.showError('Erreur lors de la création du compte. Veuillez réessayer.');
        }
    }

    hashPassword(password) {
        // Simple hash for demo - use proper encryption in production
        return btoa(password);
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
        
        const form = document.getElementById('setupForm');
        form.insertBefore(errorDiv, form.firstChild);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        
        const form = document.getElementById('setupForm');
        form.insertBefore(successDiv, form.firstChild);
    }
}

// Global function for password toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const icon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        confirmInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        confirmInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

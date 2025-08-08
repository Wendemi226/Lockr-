// Application Lockré - JavaScript principal pour GitHub Pages

// Configuration
const APP_CONFIG = {
    name: 'Lockré',
    version: '1.0.0',
    storageKey: 'lockre-data'
};

// État de l'application
let appState = {
    isLoggedIn: false,
    currentUser: null,
    sales: [],
    products: [
        { id: 1, name: 'Produit A', price: 1000, stock: 50 },
        { id: 2, name: 'Produit B', price: 2000, stock: 30 },
        { id: 3, name: 'Produit C', price: 1500, stock: 40 }
    ],
    users: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'vendeur', password: 'vendeur123', role: 'vendor' }
    ]
};

// Fonctions utilitaires
const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    },
    
    saveToStorage: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    loadFromStorage: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    
    showSection: (sectionId) => {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    },
    
    showMessage: (message, type = 'info') => {
        // Créer une notification simple
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'error') notification.style.background = '#e74c3c';
        else if (type === 'success') notification.style.background = '#27ae60';
        else notification.style.background = '#3498db';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Gestion de l'authentification
const Auth = {
    login: (username, password) => {
        const user = appState.users.find(u => 
            u.username === username && u.password === password
        );
        
        if (user) {
            appState.currentUser = user;
            appState.isLoggedIn = true;
            Utils.saveToStorage('currentUser', user);
            Utils.showMessage('Connexion réussie!', 'success');
            return true;
        }
        
        Utils.showMessage('Identifiants incorrects', 'error');
        return false;
    },
    
    logout: () => {
        appState.currentUser = null;
        appState.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        Utils.showSection('login-section');
        Utils.showMessage('Déconnexion réussie');
    },
    
    checkAuth: () => {
        const savedUser = Utils.loadFromStorage('currentUser');
        if (savedUser) {
            appState.currentUser = savedUser;
            appState.isLoggedIn = true;
            return true;
        }
        return false;
    }
};

// Gestion des ventes
const SalesManager = {
    addSale: (productId, quantity, price) => {
        const sale = {
            id: Date.now(),
            productId,
            quantity,
            price,
            total: quantity * price,
            date: new Date().toISOString(),
            user: appState.currentUser.username
        };
        
        appState.sales.unshift(sale);
        Utils.saveToStorage('sales', appState.sales);
        return sale;
    },
    
    getTodaySales: () => {
        const today = new Date().toDateString();
        return appState.sales.filter(sale => 
            new Date(sale.date).toDateString() === today
        );
    },
    
    getTotalRevenue: () => {
        const todaySales = SalesManager.getTodaySales();
        return todaySales.reduce((total, sale) => total + sale.total, 0);
    }
};

// Mise à jour de l'interface
const UI = {
    updateDashboard: () => {
        const todaySales = SalesManager.getTodaySales();
        const totalRevenue = SalesManager.getTotalRevenue();
        
        document.getElementById('total-sales').textContent = todaySales.length;
        document.getElementById('total-revenue').textContent = Utils.formatCurrency(totalRevenue);
        document.getElementById('total-products').textContent = appState.products.length;
        document.getElementById('total-vendors').textContent = appState.users.filter(u => u.role === 'vendor').length;
        
        // Afficher les ventes récentes
        const recentSalesContainer = document.getElementById('recent-sales');
        if (todaySales.length > 0) {
            recentSalesContainer.innerHTML = todaySales.slice(0, 5).map(sale => `
                <div class="activity-item">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Vente de ${sale.quantity} ${getProductName(sale.productId)} - ${Utils.formatCurrency(sale.total)}</span>
                    <small>${new Date(sale.date).toLocaleTimeString()}</small>
                </div>
            `).join('');
        } else {
            recentSalesContainer.innerHTML = '<p class="empty-state">Aucune vente aujourd\'hui</p>';
        }
    },
    
    init: () => {
        // Vérifier l'authentification au chargement
        if (Auth.checkAuth()) {
            Utils.showSection('dashboard-section');
            UI.updateDashboard();
        }
    }
};

// Fonction helper pour obtenir le nom du produit
function getProductName(productId) {
    const product = appState.products.find(p => p.id === productId);
    return product ? product.name : 'Produit inconnu';
}

// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (Auth.login(username, password)) {
                Utils.showSection('dashboard-section');
                UI.updateDashboard();
                loginForm.reset();
            }
        });
    }
    
    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', Auth.logout);
    }
    
    // Charger les données depuis le stockage local
    const savedSales = Utils.loadFromStorage('sales');
    if (savedSales) {
        appState.sales = savedSales;
    }
});

// Ajouter des styles CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }
    
    .activity-item i {
        color: #667eea;
    }
    
    .empty-state {
        text-align: center;
        color: #666;
        padding: 2rem;
    }
`;
document.head.appendChild(style);

// Lockré - Application de gestion des ventes complète et fonctionnelle

// Configuration
const APP_CONFIG = {
    name: 'Lockré',
    version: '1.0.0',
    storageKey: 'lockre-data'
};

// État de l'application
let appState = {
    currentUser: null,
    sales: [],
    products: [],
    customers: []
};

// Utilitaires
const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    },
    
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    },
    
    saveData: () => {
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify({
            sales: appState.sales,
            products: appState.products,
            customers: appState.customers
        }));
    },
    
    loadData: () => {
        const data = localStorage.getItem(APP_CONFIG.storageKey);
        if (data) {
            const parsed = JSON.parse(data);
            appState.sales = parsed.sales || [];
            appState.products = parsed.products || [];
            appState.customers = parsed.customers || [];
        }
    },
    
    showMessage: (message, type = 'info') => {
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
        setTimeout(() => notification.remove(), 3000);
    }
};

// Authentification
const Auth = {
    users: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'vendeur', password: 'vendeur123', role: 'vendor' }
    ],
    
    login: (username, password) => {
        const user = Auth.users.find(u => u.username === username && u.password === password);
        if (user) {
            appState.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    },
    
    logout: () => {
        appState.currentUser = null;
        localStorage.removeItem('currentUser');
        showScreen('login-screen');
    },
    
    checkAuth: () => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            appState.currentUser = JSON.parse(savedUser);
            return true;
        }
        return false;
    }
};

// Gestion des ventes
const SalesManager = {
    addSale: (sale) => {
        sale.id = Date.now();
        sale.date = new Date().toISOString();
        sale.total = sale.quantity * sale.price;
        appState.sales.unshift(sale);
        Utils.saveData();
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
    },
    
    getMonthlyRevenue: () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return appState.sales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            })
            .reduce((total, sale) => total + sale.total, 0);
    }
};

// Gestion des produits
const ProductManager = {
    addProduct: (product) => {
        product.id = Date.now();
        appState.products.push(product);
        Utils.saveData();
        return product;
    },
    
    updateProduct: (id, updates) => {
        const product = appState.products.find(p => p.id === id);
        if (product) {
            Object.assign(product, updates);
            Utils.saveData();
            return product;
        }
    },
    
    deleteProduct: (id) => {
        appState.products = appState.products.filter(p => p.id !== id);
        Utils.saveData();
    },
    
    getProductById: (id) => {
        return appState.products.find(p => p.id === id);
    }
};

// Interface utilisateur
const UI = {
    init: () => {
        Utils.loadData();
        
        // Initialiser les écouteurs d'événements
        initEventListeners();
        
        // Vérifier l'authentification
        if (Auth.checkAuth()) {
            showScreen('dashboard-screen');
            UI.updateDashboard();
        }
    },
    
    updateDashboard: () => {
        const todaySales = SalesManager.getTodaySales();
        const totalRevenue = SalesManager.getTotalRevenue();
        const monthlyRevenue = SalesManager.getMonthlyRevenue();
        
        document.getElementById('total-sales').textContent = todaySales.length;
        document.getElementById('total-revenue').textContent = Utils.formatCurrency(totalRevenue);
        document.getElementById('total-products').textContent = appState.products.length;
        document.getElementById('total-customers').textContent = [...new Set(appState.sales.map(s => s.customer))].length;
        
        // Mettre à jour les rapports
        document.getElementById('daily-report').innerHTML = `
            <p>Ventes aujourd'hui: ${todaySales.length}</p>
            <p>Revenu: ${Utils.formatCurrency(totalRevenue)}</p>
        `;
        
        document.getElementById('monthly-report').innerHTML = `
            <p>Ventes ce mois: ${appState.sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.getMonth() === new Date().getMonth() && saleDate.getFullYear() === new Date().getFullYear();
            }).length}</p>
            <p>Revenu mensuel: ${Utils.formatCurrency(monthlyRevenue)}</p>
        `;
        
        // Afficher les ventes récentes
        UI.displayRecentSales();
        UI.displaySalesList();
        UI.displayProductsList();
        UI.populateProductSelect();
    },
    
    displayRecentSales: () => {
        const recentSales = appState.sales.slice(0, 5);
        const container = document.getElementById('recent-sales-list');
        
        if (recentSales.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune vente récente</p>';
            return;
        }
        
        container.innerHTML = recentSales.map(sale => {
            const product = ProductManager.getProductById(sale.productId);
            return `
                <div class="activity-item">
                    <div>
                        <strong>${sale.customer}</strong> - ${product?.name || 'Produit inconnu'}
                        <br>
                        <small>${Utils.formatDate(sale.date)} - ${sale.quantity} × ${Utils.formatCurrency(sale.price)}</small>
                    </div>
                    <div>${Utils.formatCurrency(sale.total)}</div>
                </div>
            `;
        }).join('');
    },
    
    displaySalesList: () => {
        const container = document.getElementById('sales-list');
        
        if (appState.sales.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune vente enregistrée</p>';
            return;
        }
        
        container.innerHTML = appState.sales.map(sale => {
            const product = ProductManager.getProductById(sale.productId);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${product?.name || 'Produit inconnu'}</h4>
                        <p>Client: ${sale.customer}</p>
                        <p>Quantité: ${sale.quantity} × ${Utils.formatCurrency(sale.price)}</p>
                        <p>Date: ${Utils.formatDate(sale.date)}</p>
                    </div>
                    <div>
                        <strong>${Utils.formatCurrency(sale.total)}</strong>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    displayProductsList: () => {
        const container = document.getElementById('products-list');
        
        if (appState.products.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun produit enregistré</p>';
            return;
        }
        
        container.innerHTML = appState.products.map(product => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${product.name}</h4>
                    <p>Prix: ${Utils.formatCurrency(product.price)}</p>
                    <p>Stock: ${product.stock} unités</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    populateProductSelect: () => {
        const select = document.getElementById('sale-product');
        select.innerHTML = '<option value="">Sélectionner un produit</option>';
        
        appState.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${Utils.formatCurrency(product.price)}`;
            select.appendChild(option);
        });
    }
};

// Fonctions d'affichage
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId.replace('-section', '')}"]`).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        ProductManager.deleteProduct(productId);
        UI.displayProductsList();
        UI.populateProductSelect();
        UI.updateDashboard();
        Utils.showMessage('Produit supprimé avec succès', 'success');
    }
}

// Écouteurs d'événements
function initEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (Auth.login(username, password)) {
                showScreen('dashboard-screen');
                document.getElementById('user-info').textContent = username;
                UI.updateDashboard();
                loginForm.reset();
            } else {
                Utils.showMessage('Identifiants incorrects', 'error');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
            Utils.showMessage('Déconnexion réussie');
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.section + '-section');
        });
    });
    
    // Sale form
    const saleForm = document.getElementById('sale-form');
    if (saleForm) {
        saleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sale = {
                productId: parseInt(document.getElementById('sale-product').value),
                quantity: parseInt(document.getElementById('sale-quantity').value),
                price: parseFloat(document.getElementById('sale-price').value),
                customer: document.getElementById('sale-customer').value
            };
            
            SalesManager.addSale(sale);
            UI.updateDashboard();
            closeModal('sale-modal');
            saleForm.reset();
            Utils.showMessage('Vente enregistrée avec succès', 'success');
        });
    }
    
    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const product = {
                name: document.getElementById('product-name').value,
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value)
            };
            
            ProductManager.addProduct(product);
            UI.updateDashboard();
            closeModal('product-modal');
            productForm.reset();
            Utils.showMessage('Produit ajouté avec succès', 'success');
        });
    }
    
    // Product select change
    const productSelect = document.getElementById('sale-product');
    if (productSelect) {
        productSelect.addEventListener('change', (e) => {
            const product = ProductManager.getProductById(parseInt(e.target.value));
            if (product) {
                document.getElementById('sale-price').value = product.price;
            }
        });
    }
    
    // Modal buttons
    document.getElementById('add-sale-btn')?.addEventListener('click', () => showModal('sale-modal'));
    document.getElementById('add-product-btn')?.addEventListener('click', () => showModal('product-modal'));
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    
    // Ajouter des produits de démonstration si aucun produit
    if (appState.products.length === 0) {
        ProductManager.addProduct({ name: 'Riz 1kg', price: 1000, stock: 50 });
        ProductManager.addProduct({ name: 'Huile 1L', price: 1500, stock: 30 });
        ProductManager.addProduct({ name: 'Sucre 1kg', price: 800, stock: 40 });
        Utils.showMessage('Produits de démonstration ajoutés', 'info');
    }
});

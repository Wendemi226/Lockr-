/**
 * Admin Dashboard Component for Lockré
 * Comprehensive management interface for administrators
 */

class AdminDashboard {
    constructor() {
        this.db = new DatabaseManager();
        this.currentUser = JSON.parse(localStorage.getItem('lockre_current_user'));
        this.init();
    }

    async init() {
        await this.db.init();
        this.render();
    }

    render() {
        document.body.innerHTML = `
            <div class="admin-dashboard">
                <!-- Sidebar -->
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="logo">
                            <i class="fas fa-lock"></i>
                            <span>Lockré</span>
                        </div>
                        <div class="user-info">
                            <div class="avatar">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="user-details">
                                <h4>${this.currentUser.fullName}</h4>
                                <span>Administrateur</span>
                            </div>
                        </div>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <a href="#" class="nav-item active" data-section="dashboard">
                            <i class="fas fa-chart-line"></i>
                            Tableau de bord
                        </a>
                        <a href="#" class="nav-item" data-section="vendors">
                            <i class="fas fa-users"></i>
                            Gestion vendeurs
                        </a>
                        <a href="#" class="nav-item" data-section="products">
                            <i class="fas fa-boxes"></i>
                            Gestion stock
                        </a>
                        <a href="#" class="nav-item" data-section="sales">
                            <i class="fas fa-shopping-cart"></i>
                            Ventes
                        </a>
                        <a href="#" class="nav-item" data-section="reports">
                            <i class="fas fa-file-alt"></i>
                            Rapports
                        </a>
                        <a href="#" class="nav-item" data-section="settings">
                            <i class="fas fa-cog"></i>
                            Paramètres
                        </a>
                        <a href="#" class="nav-item logout" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            Déconnexion
                        </a>
                    </nav>
                </aside>

                <!-- Main Content -->
                <main class="main-content">
                    <header class="content-header">
                        <h1>Tableau de bord administrateur</h1>
                        <div class="header-actions">
                            <button class="btn btn-primary" onclick="addVendor()">
                                <i class="fas fa-plus"></i>
                                Ajouter vendeur
                            </button>
                            <button class="btn btn-secondary" onclick="exportData()">
                                <i class="fas fa-download"></i>
                                Exporter
                            </button>
                        </div>
                    </header>

                    <div class="dashboard-content">
                        <!-- Stats Overview -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-dollar-sign"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>Chiffre d'affaires</h3>
                                    <div class="stat-value" id="totalRevenue">0 FCFA</div>
                                    <div class="stat-change positive">
                                        <i class="fas fa-arrow-up"></i>
                                        <span>+12.5% vs hier</span>
                                    </div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-shopping-cart"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>Ventes totales</h3>
                                    <div class="stat-value" id="totalSales">0</div>
                                    <div class="stat-change positive">
                                        <i class="fas fa-arrow-up"></i>
                                        <span>+8 ventes aujourd'hui</span>
                                    </div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>Vendeurs actifs</h3>
                                    <div class="stat-value" id="activeVendors">0</div>
                                    <div class="stat-change neutral">
                                        <span>Actifs aujourd'hui</span>
                                    </div>
                                </div>
                            </div>

                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-boxes"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>Produits en stock</h3>
                                    <div class="stat-value" id="totalProducts">0</div>
                                    <div class="stat-change negative">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>5 produits faibles</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Charts Section -->
                        <div class="charts-section">
                            <div class="chart-container">
                                <h3>Ventes par vendeur</h3>
                                <canvas id="vendorChart"></canvas>
                            </div>

                            <div class="chart-container">
                                <h3>Évolution des ventes</h3>
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>

                        <!-- Recent Activity -->
                        <div class="recent-activity">
                            <h3>Activité récente</h3>
                            <div class="activity-list" id="recentActivity">
                                <!-- Activity items will be populated here -->
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.attachEventListeners();
        this.loadDashboardData();
    }

    attachEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-item').dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
    }

    async loadDashboardData() {
        try {
            // Load summary statistics
            const today = new Date().toISOString().split('T')[0];
            const sales = await this.db.getSalesByDateRange(today, today);
            const products = await this.db.getAllProducts();
            const users = await this.db.getAllUsers();
            
            // Update UI with real data
            this.updateStats(sales, products, users);
            this.renderCharts();
            this.renderRecentActivity(sales);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateStats(sales, products, users) {
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalSales = sales.length;
        const activeVendors = users.filter(u => u.role === 'vendor').length;
        const totalProducts = products.length;

        document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()} FCFA`;
        document.getElementById('totalSales').textContent = totalSales;
        document.getElementById('activeVendors').textContent = activeVendors;
        document.getElementById('totalProducts').textContent = totalProducts;
    }

    renderCharts() {
        // Placeholder for chart rendering
        // Will integrate Chart.js for actual charts
        console.log('Charts rendered');
    }

    renderRecentActivity(sales) {
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = sales.slice(0, 5).map(sale => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="activity-content">
                    <h4>Vente #${sale.id}</h4>
                    <p>Vente effectuée par ${sale.vendor_name || 'Vendeur'}</p>
                    <span class="activity-time">${sale.total_amount.toLocaleString()} FCFA</span>
                </div>
            </div>
        `).join('');
    }

    switchSection(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Load section content
        console.log(`Loading section: ${section}`);
    }
}

// Global logout function
function logout() {
    localStorage.removeItem('lockre_current_user');
    window.location.reload();
}

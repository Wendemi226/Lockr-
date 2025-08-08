/**
 * Lockré - Main Application Entry Point
 * Modern offline sales management software for African businesses
 */

class LockreApp {
    constructor() {
        this.currentUser = null;
        this.database = null;
        this.init();
    }

    init() {
        this.setupDatabase();
        this.checkAuthentication();
        this.setupEventListeners();
    }

    setupDatabase() {
        // Initialize SQLite database for offline storage
        this.database = new DatabaseManager();
        this.database.init();
    }

    checkAuthentication() {
        const storedUser = localStorage.getItem('lockre_current_user');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Global event listeners for the application
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeUI();
        });
    }

    showLogin() {
        const loginComponent = new LoginComponent();
        loginComponent.render();
    }

    showDashboard() {
        if (this.currentUser.role === 'admin') {
            const adminDashboard = new AdminDashboard();
            adminDashboard.render();
        } else {
            const vendorDashboard = new VendorDashboard();
            vendorDashboard.render();
        }
    }

    initializeUI() {
        // Initialize the main application interface
        console.log('Lockré Application Started');
    }
}

// Initialize the application
const app = new LockreApp();

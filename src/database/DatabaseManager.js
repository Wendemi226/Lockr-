/**
 * Database Manager for Lockré
 * Handles all SQLite database operations for offline functionality
 */

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbName = 'lockre_sales_db';
        this.version = 1;
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Users table
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('role', 'role');
                }

                // Products table
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                    productStore.createIndex('name', 'name');
                    productStore.createIndex('category', 'category');
                    productStore.createIndex('barcode', 'barcode', { unique: true });
                }

                // Sales table
                if (!db.objectStoreNames.contains('sales')) {
                    const saleStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
                    saleStore.createIndex('date', 'date');
                    saleStore.createIndex('vendor_id', 'vendor_id');
                    saleStore.createIndex('total_amount', 'total_amount');
                }

                // Customers table
                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                    customerStore.createIndex('phone', 'phone', { unique: true });
                    customerStore.createIndex('name', 'name');
                }

                // Inventory table
                if (!db.objectStoreNames.contains('inventory')) {
                    const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
                    inventoryStore.createIndex('product_id', 'product_id');
                    inventoryStore.createIndex('quantity', 'quantity');
                }

                // Settings table
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
                    settingsStore.createIndex('key', 'key', { unique: true });
                }
            };
        });
    }

    // User operations
    async createUser(userData) {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        return store.add(userData);
    }

    async getUser(username) {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('username');
        return index.get(username);
    }

    async getAllUsers() {
        const transaction = this.db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        return store.getAll();
    }

    // Product operations
    async createProduct(product) {
        const transaction = this.db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        return store.add(product);
    }

    async getAllProducts() {
        const transaction = this.db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        return store.getAll();
    }

    async updateProduct(id, updates) {
        const transaction = this.db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const product = await store.get(id);
        Object.assign(product, updates);
        return store.put(product);
    }

    // Sales operations
    async createSale(saleData) {
        const transaction = this.db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        return store.add(saleData);
    }

    async getSalesByDateRange(startDate, endDate) {
        const transaction = this.db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const index = store.index('date');
        const range = IDBKeyRange.bound(startDate, endDate);
        return index.getAll(range);
    }

    async getSalesByVendor(vendorId) {
        const transaction = this.db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const index = store.index('vendor_id');
        return index.getAll(vendorId);
    }

    // Settings operations
    async setSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        return store.put({ key, value });
    }

    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        return store.get(key);
    }
}

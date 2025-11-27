class RICSStore {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentSort = { field: 'name', direction: 'asc' };
        this.init();
    }

    async init() {
        console.log('RICS Store initializing...');
        await this.loadItems();
        this.renderItems();
        this.setupEventListeners();
        console.log('RICS Store initialized with', this.items.length, 'items');
    }

    async loadItems() {
        try {
            console.log('Loading items from StoreItems.json...');

            // Try different possible paths
            const paths = [
                'data/StoreItems.json',
                '../data/StoreItems.json',
                './data/StoreItems.json',
                'StoreItems.json'
            ];

            let data = null;
            let successfulPath = null;

            for (const path of paths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        data = await response.json();
                        successfulPath = path;
                        console.log('Successfully loaded data from:', path);
                        break;
                    }
                } catch (e) {
                    console.log('Failed to load from:', path, e);
                    continue;
                }
            }

            if (!data) {
                throw new Error('Could not load StoreItems.json from any path');
            }

            // Convert the object to an array and filter enabled items
            this.items = Object.entries(data)
                .map(([defname, itemData]) => ({
                    defname,
                    name: itemData.CustomName || defname,
                    price: itemData.BasePrice || 0,
                    category: itemData.Category || 'Misc',
                    weight: itemData.Weight || 0,
                    quantityLimit: itemData.QuantityLimit || 0,
                    limitMode: itemData.LimitMode,
                    mod: itemData.Mod,
                    enabled: itemData.Enabled !== false,
                    karmaType: itemData.KarmaType
                }))
                .filter(item => item.enabled && item.price > 0);

            console.log('Processed items:', this.items);
            this.filteredItems = [...this.items];

        } catch (error) {
            console.error('Error loading items:', error);
            // Fallback to sample data
            console.log('Loading sample data instead...');
            this.loadSampleData();
        }
    }

    loadSampleData() {
        console.log('Loading sample data...');
        this.items = [
            {
                defname: 'TextBook',
                name: 'Textbook',
                price: 267,
                category: 'Books',
                weight: 1.0,
                quantityLimit: 5,
                limitMode: 'OneStack',
                mod: 'Core',
                enabled: true,
                karmaType: null
            },
            {
                defname: 'MedicineHerbal',
                name: 'Herbal Medicine',
                price: 150,
                category: 'Medical',
                weight: 0.1,
                quantityLimit: 25,
                limitMode: 'OneStack',
                mod: 'Core',
                enabled: true,
                karmaType: null
            },
            {
                defname: 'Pemmican',
                name: 'Pemmican',
                price: 80,
                category: 'Food',
                weight: 0.05,
                quantityLimit: 100,
                limitMode: 'OneStack',
                mod: 'Core',
                enabled: true,
                karmaType: null
            }
        ];
        this.filteredItems = [...this.items];
        console.log('Sample data loaded:', this.items);
    }

    renderItems() {
        const tbody = document.getElementById('items-tbody');
        console.log('Rendering items. Filtered count:', this.filteredItems.length);

        if (this.filteredItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No items found</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredItems.map(item => `
            <tr>
                <td>
                    ${this.escapeHtml(item.name)}
                    ${item.mod ? `<span class="metadata">From ${this.escapeHtml(item.mod)}</span>` : ''}
                </td>
                <td>
                    ${item.price}
                    ${item.karmaType ? `<span class="metadata">Karma: ${this.escapeHtml(item.karmaType)}</span>` : ''}
                </td>
                <td>${this.escapeHtml(item.category)}</td>
                <td>${item.weight}</td>
                <td>
                    ${item.quantityLimit > 0 ? item.quantityLimit : 'Unlimited'}
                    ${item.limitMode ? `<span class="metadata">${this.escapeHtml(item.limitMode)}</span>` : ''}
                </td>
            </tr>
        `).join('');

        console.log('Items rendered successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Search functionality
        const searchInput = document.getElementById('items-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                console.log('Search input:', e.target.value);
                this.filterItems(e.target.value);
            });
        } else {
            console.error('Search input not found!');
        }

        // Sort functionality
        const headers = document.querySelectorAll('th[data-sort]');
        console.log('Found sort headers:', headers.length);
        headers.forEach(header => {
            header.addEventListener('click', () => {
                console.log('Sorting by:', header.dataset.sort);
                this.sortItems(header.dataset.sort);
            });
        });

        // Tab functionality
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Switching to tab:', button.dataset.tab);
                this.switchTab(button.dataset.tab);
            });
        });

        console.log('Event listeners setup complete');
    }

    filterItems(searchTerm) {
        console.log('Filtering items with term:', searchTerm);
        const term = searchTerm.toLowerCase().trim();

        if (term === '') {
            this.filteredItems = [...this.items];
        } else {
            this.filteredItems = this.items.filter(item =>
                item.name.toLowerCase().includes(term) ||
                (item.category && item.category.toLowerCase().includes(term)) ||
                (item.mod && item.mod.toLowerCase().includes(term)) ||
                (item.defname && item.defname.toLowerCase().includes(term))
            );
        }

        console.log('Items after filtering:', this.filteredItems.length);
        this.sortItems(this.currentSort.field, false); // Re-sort without changing direction
        this.renderItems();
    }

    sortItems(field, changeDirection = true) {
        console.log('Sorting by:', field, 'changeDirection:', changeDirection);

        if (changeDirection) {
            if (this.currentSort.field === field) {
                this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.currentSort.field = field;
                this.currentSort.direction = 'asc';
            }
        }

        this.filteredItems.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            // Handle null/undefined values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';

            // Handle string comparison
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Update sort indicators
        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === field) {
                header.classList.add(`sort-${this.currentSort.direction}`);
            }
        });

        this.renderItems();
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the store when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing RICS Store');
    new RICSStore();
});
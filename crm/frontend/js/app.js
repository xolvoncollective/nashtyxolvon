// Format currency/number
const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Format date
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check if API is available
    if (typeof API === 'undefined') {
        console.error('API client not found!');
        alert('System Error: API Client missing');
        return;
    }

    // Function to initialize CRM once auth is ready
    function initCRM(authData) {
        if (!authData || !authData.token) return;
        
        // Update API session
        API.session.token = authData.token;
        API.session.user = authData.user;
        API.session.tenantId = authData.user.tenantId || '00000000-0000-0000-0000-000000000001';
        
        // Update UI with user info
        document.getElementById('userName').textContent = authData.user.name || authData.user.username;
        document.getElementById('userRole').textContent = authData.user.role;
        document.getElementById('userAvatar').textContent = (authData.user.name || authData.user.username).charAt(0).toUpperCase();

        // Initial Load
        loadCustomers();
    }

    window.onAuthReceived = initCRM;

    // If already authenticated (e.g. reload)
    if (typeof NASHTY_AUTH !== 'undefined' && NASHTY_AUTH.hasValidAuth()) {
        initCRM(NASHTY_AUTH.getAuthData());
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const pageContents = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            
            // Update Active Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Active Content
            pageContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId + 'Tab').classList.add('active');

            // Update Title
            pageTitle.textContent = item.querySelector('span:last-child').textContent;

            // Load Data based on tab
            if (tabId === 'customers') loadCustomers();
            if (tabId === 'rewards') loadRewards();
            if (tabId === 'transactions') loadTransactions();
        });
    });

    // --- DATA LOADING ---

    const customersTableBody = document.getElementById('customersTableBody');
    const rewardsGrid = document.getElementById('rewardsGrid');
    const transactionsTableBody = document.getElementById('transactionsTableBody');
    const searchCustomer = document.getElementById('searchCustomer');

    let allCustomers = [];

    async function loadCustomers() {
        try {
            customersTableBody.innerHTML = '<tr><td colspan="6" class="text-center empty-state">Memuat data pelanggan...</td></tr>';
            const { data, error } = await API.supabase
                .from('customers') // assuming the table is customers
                .select('*')
                .eq('tenant_id', API.session.tenantId);
            
            if (error) throw error;
            
            allCustomers = data || [];
            renderCustomers();
        } catch (error) {
            console.error('Failed to load customers:', error);
            customersTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }

    function renderCustomers() {
        const query = searchCustomer.value.toLowerCase();
        const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query)));

        if (filtered.length === 0) {
            customersTableBody.innerHTML = '<tr><td colspan="6" class="text-center empty-state">Belum ada data pelanggan</td></tr>';
            return;
        }

        customersTableBody.innerHTML = '';
        filtered.forEach(customer => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold">${customer.name}</td>
                <td>
                    ${customer.phone || '-'}<br>
                    <small class="text-secondary">${customer.email || ''}</small>
                </td>
                <td class="font-bold text-success">${formatNumber(customer.points || 0)} Pts</td>
                <td>${formatCurrency(customer.total_spent || 0)}</td>
                <td>${formatNumber(customer.visit_count || 0)}x</td>
                <td class="text-center">
                    <button class="btn btn-danger delete-customer-btn" data-id="${customer.id}">Hapus</button>
                </td>
            `;
            customersTableBody.appendChild(tr);
        });

        // Delete handlers
        document.querySelectorAll('.delete-customer-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Hapus pelanggan ini beserta poinnya?')) {
                    try {
                        const { error } = await API.supabase.from('customers').delete().eq('id', id);
                        if (error) throw error;
                        loadCustomers();
                    } catch (err) { alert('Error: ' + err.message); }
                }
            });
        });
    }

    searchCustomer.addEventListener('input', renderCustomers);

    async function loadRewards() {
        try {
            rewardsGrid.innerHTML = '<div class="empty-state">Memuat katalog reward...</div>';
            const { data, error } = await API.supabase
                .from('rewards')
                .select('*')
                .eq('tenant_id', API.session.tenantId);
            
            if (error) throw error;
            
            renderRewards(data || []);
        } catch (error) {
            rewardsGrid.innerHTML = `<div class="text-danger">Gagal memuat data: ${error.message}</div>`;
        }
    }

    function renderRewards(rewards) {
        if (rewards.length === 0) {
            rewardsGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center;">Belum ada reward ditambahkan</div>';
            return;
        }

        rewardsGrid.innerHTML = '';
        rewards.forEach(reward => {
            const card = document.createElement('div');
            card.className = 'reward-card';
            card.innerHTML = `
                <div class="reward-points">${formatNumber(reward.points_required)} Pts</div>
                <h3 class="reward-title">${reward.title}</h3>
                <p class="reward-desc">${reward.description || 'Tidak ada deskripsi.'}</p>
                <div class="reward-actions">
                    <button class="btn btn-danger delete-reward-btn" data-id="${reward.id}">Hapus</button>
                </div>
            `;
            rewardsGrid.appendChild(card);
        });

        document.querySelectorAll('.delete-reward-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Hapus reward ini dari katalog?')) {
                    try {
                        const { error } = await API.supabase.from('rewards').delete().eq('id', id);
                        if (error) throw error;
                        loadRewards();
                    } catch (err) { alert('Error: ' + err.message); }
                }
            });
        });
    }

    async function loadTransactions() {
        try {
            transactionsTableBody.innerHTML = '<tr><td colspan="4" class="text-center empty-state">Memuat riwayat poin...</td></tr>';
            const { data: txs, error } = await API.supabase
                .from('point_transactions')
                .select('*')
                .eq('tenant_id', API.session.tenantId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (!txs || txs.length === 0) {
                transactionsTableBody.innerHTML = '<tr><td colspan="4" class="text-center empty-state">Belum ada riwayat transaksi poin</td></tr>';
                return;
            }

            transactionsTableBody.innerHTML = '';
            txs.forEach(tx => {
                const tr = document.createElement('tr');
                const isEarn = tx.type === 'earn';
                tr.innerHTML = `
                    <td>${formatDate(tx.created_at)}</td>
                    <td><span class="badge ${isEarn ? 'gaji' : 'bahan-baku'}">${isEarn ? 'Penambahan' : 'Penukaran'}</span></td>
                    <td class="font-bold ${isEarn ? 'text-success' : 'text-danger'}">
                        ${isEarn ? '+' : '-'}${formatNumber(tx.points)}
                    </td>
                    <td>${tx.description || '-'}</td>
                `;
                transactionsTableBody.appendChild(tr);
            });
        } catch (error) {
            transactionsTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }

    // --- MODALS ---

    const setupModal = (modalId, closeSelector) => {
        const modal = document.getElementById(modalId);
        document.querySelectorAll(closeSelector).forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
                modal.querySelector('form').reset();
            });
        });
        return modal;
    };

    const customerModal = setupModal('customerModal', '[data-close="customerModal"]');
    const rewardModal = setupModal('rewardModal', '[data-close="rewardModal"]');

    document.getElementById('addCustomerBtn').addEventListener('click', () => customerModal.classList.add('active'));
    document.getElementById('addRewardBtn').addEventListener('click', () => rewardModal.classList.add('active'));

    // Form Submits
    document.getElementById('customerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const { error } = await API.supabase.from('customers').insert([{
                tenant_id: API.session.tenantId,
                name: document.getElementById('customerName').value,
                phone: document.getElementById('customerPhone').value,
                email: document.getElementById('customerEmail').value
            }]);
            if (error) throw error;
            
            customerModal.classList.remove('active');
            e.target.reset();
            loadCustomers();
        } catch (error) {
            alert('Gagal menambah pelanggan: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    });

    document.getElementById('rewardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const { error } = await API.supabase.from('rewards').insert([{
                tenant_id: API.session.tenantId,
                title: document.getElementById('rewardTitle').value,
                points_required: Number(document.getElementById('rewardPoints').value),
                description: document.getElementById('rewardDesc').value
            }]);
            if (error) throw error;
            
            rewardModal.classList.remove('active');
            e.target.reset();
            loadRewards();
        } catch (error) {
            alert('Gagal menambah reward: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    });

});

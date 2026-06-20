// Format currency
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

    // Verify authentication
    if (!API.session || !API.session.token) {
        alert('Anda belum login. Silakan login dari Launcher.');
        window.location.href = '/';
        return;
    }

    // Update UI with user info
    document.getElementById('userName').textContent = API.session.user.name;
    document.getElementById('userRole').textContent = API.session.user.role;
    document.getElementById('userAvatar').textContent = API.session.user.name.charAt(0).toUpperCase();

    // Elements
    const costTableBody = document.getElementById('costTableBody');
    const totalCostEl = document.getElementById('totalCost');
    const bahanBakuCostEl = document.getElementById('bahanBakuCost');
    const operasionalCostEl = document.getElementById('operasionalCost');
    
    // Modal Elements
    const addCostModal = document.getElementById('addCostModal');
    const addCostBtn = document.getElementById('addCostBtn');
    const closeCostModal = document.getElementById('closeCostModal');
    const cancelCostBtn = document.getElementById('cancelCostBtn');
    const addCostForm = document.getElementById('addCostForm');

    // Filter Elements
    const filterCategory = document.getElementById('filterCategory');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    // Fetch Costs
    async function loadCosts() {
        try {
            costTableBody.innerHTML = '<tr><td colspan="5" class="text-center empty-state">Memuat data...</td></tr>';
            
            const params = new URLSearchParams({
                tenantId: API.session.tenantId
            });

            // If user is not owner, limit to their outlet
            if (API.session.user.role !== 'owner' && API.session.outletId) {
                params.append('outletId', API.session.outletId);
            }

            if (filterCategory.value) params.append('category', filterCategory.value);
            if (filterDateFrom.value) params.append('dateFrom', filterDateFrom.value);
            if (filterDateTo.value) params.append('dateTo', filterDateTo.value);

            const res = await API.request(`/costs?${params.toString()}`);
            
            if (res.success) {
                renderCosts(res.costs);
            }
        } catch (error) {
            console.error('Failed to load costs:', error);
            costTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }

    function renderCosts(costs) {
        if (!costs || costs.length === 0) {
            costTableBody.innerHTML = '<tr><td colspan="5" class="text-center empty-state">Belum ada data pengeluaran</td></tr>';
            totalCostEl.textContent = 'Rp 0';
            bahanBakuCostEl.textContent = 'Rp 0';
            operasionalCostEl.textContent = 'Rp 0';
            return;
        }

        let total = 0;
        let bahanBaku = 0;
        let operasional = 0;
        
        costTableBody.innerHTML = '';

        costs.forEach(cost => {
            const amount = Number(cost.amount);
            total += amount;
            
            if (cost.category === 'bahan-baku') bahanBaku += amount;
            if (cost.category === 'operasional') operasional += amount;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(cost.created_at)}</td>
                <td><span class="badge ${cost.category}">${cost.category.replace('-', ' ')}</span></td>
                <td>${cost.description || '-'}</td>
                <td class="text-right font-bold">${formatCurrency(amount)}</td>
                <td class="text-center">
                    <button class="btn btn-danger delete-btn" data-id="${cost.id}">Hapus</button>
                </td>
            `;
            costTableBody.appendChild(tr);
        });

        // Update summaries
        totalCostEl.textContent = formatCurrency(total);
        bahanBakuCostEl.textContent = formatCurrency(bahanBaku);
        operasionalCostEl.textContent = formatCurrency(operasional);

        // Attach delete events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus biaya ini?')) {
                    try {
                        const btnEl = e.target;
                        btnEl.textContent = '...';
                        btnEl.disabled = true;
                        await API.request(`/costs/${id}`, { method: 'DELETE' });
                        loadCosts();
                    } catch (err) {
                        alert('Gagal menghapus: ' + err.message);
                        btnEl.textContent = 'Hapus';
                        btnEl.disabled = false;
                    }
                }
            });
        });
    }

    // Modal Handlers
    addCostBtn.addEventListener('click', () => {
        addCostModal.classList.add('active');
    });

    const closeModal = () => {
        addCostModal.classList.remove('active');
        addCostForm.reset();
    };

    closeCostModal.addEventListener('click', closeModal);
    cancelCostBtn.addEventListener('click', closeModal);

    // Form Submit
    addCostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = addCostForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        const payload = {
            tenantId: API.session.tenantId,
            outletId: API.session.outletId,
            category: document.getElementById('costCategory').value,
            amount: Number(document.getElementById('costAmount').value),
            description: document.getElementById('costDescription').value
        };

        try {
            await API.request('/costs', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            closeModal();
            loadCosts(); // Refresh data
        } catch (error) {
            console.error('Error saving cost:', error);
            alert('Gagal menyimpan biaya: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Biaya';
        }
    });

    // Filter Handlers
    applyFiltersBtn.addEventListener('click', loadCosts);

    // Initial Load
    // Set default dates (first day of month to today)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    filterDateFrom.value = firstDay.toISOString().split('T')[0];
    filterDateTo.value = today.toISOString().split('T')[0];
    
    loadCosts();
});

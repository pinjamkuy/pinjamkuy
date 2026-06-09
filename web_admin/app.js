/* ==========================================================================
   PinjamKuy — Web Admin Application Logic (Vanilla JS + Supabase)
   ========================================================================== */

// ─── Supabase Configuration ───────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DOM Elements ────────────────────────────────────────────────────────
const appLoader = document.getElementById('app-loader');
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');
const userEmailSpan = document.getElementById('user-email');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');

// Tab panes
const tabs = {
    overview: document.getElementById('tab-overview'),
    catalog: document.getElementById('tab-catalog'),
    logs: document.getElementById('tab-logs')
};

// Overview Stats
const statTotalItems = document.getElementById('stat-total-items');
const statActiveLoans = document.getElementById('stat-active-loans');
const statAvailableItems = document.getElementById('stat-available-items');
const statTotalLogs = document.getElementById('stat-total-logs');

// Tables and Form elements
const activeLoansBody = document.getElementById('active-loans-body');
const catalogItemsBody = document.getElementById('catalog-items-body');
const allLogsBody = document.getElementById('all-logs-body');
const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemCategorySelect = document.getElementById('item-category');
const catalogSearchInput = document.getElementById('catalog-search');
const btnExportPdf = document.getElementById('btn-export-pdf');

// ─── Authentication Logic ──────────────────────────────────────────────
async function checkAuth() {
    showLoader();
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            // User is authenticated
            userEmailSpan.textContent = session.user.email;
            loginContainer.classList.add('container-hidden');
            dashboardContainer.classList.remove('dashboard-container', 'container-hidden');
            dashboardContainer.classList.add('dashboard-container'); // ensure layout class
            
            // Initialize Dashboard data & subscription
            await initDashboard();
        } else {
            // User is not authenticated
            dashboardContainer.classList.add('container-hidden');
            loginContainer.classList.remove('container-hidden');
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        showToast("Gagal melakukan pengecekan sesi auth", "error");
    } finally {
        hideLoader();
    }
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    showLoader();
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        showToast("Berhasil masuk! Selamat datang.", "success");
        loginForm.reset();
        await checkAuth();
    } catch (err) {
        console.error(err);
        showToast(err.message || "Gagal masuk. Periksa kembali email dan password.", "error");
    } finally {
        hideLoader();
    }
});

// Logout Handler
btnLogout.addEventListener('click', async () => {
    showLoader();
    try {
        await supabase.auth.signOut();
        showToast("Berhasil keluar.", "success");
        // Clear all table contents
        activeLoansBody.innerHTML = '';
        catalogItemsBody.innerHTML = '';
        allLogsBody.innerHTML = '';
        
        // Return to login screen
        await checkAuth();
    } catch (err) {
        console.error(err);
        showToast("Gagal keluar.", "error");
        hideLoader();
    }
});

// ─── Real-Time Sync & Inits ────────────────────────────────────────────
let realtimeChannel = null;

async function initDashboard() {
    // 1. Initial Load of all data
    await Promise.all([
        loadStats(),
        loadActiveLoans(),
        loadCatalogItems(),
        loadAllLogs()
    ]);

    // 2. Setup Realtime subscription for items and borrow_logs
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabase.channel('realtime-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
            loadStats();
            loadActiveLoans();
            loadCatalogItems();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'borrow_logs' }, () => {
            loadStats();
            loadActiveLoans();
            loadAllLogs();
        })
        .subscribe((status) => {
            console.log("Realtime Sync Status:", status);
        });
}

// ─── Data Loading Functions ────────────────────────────────────────────

// 1. Stats Loader
async function loadStats() {
    try {
        // Fetch items stats
        const { data: items, error: errItems } = await supabase.from('items').select('id, is_available, category');
        if (errItems) throw errItems;

        const total = items.length;
        const available = items.filter(i => i.is_available).length;
        const activeLoans = total - available;

        // Fetch logs count
        const { count: totalLogs, error: errLogs } = await supabase
            .from('borrow_logs')
            .select('*', { count: 'exact', head: true });
        if (errLogs) throw errLogs;

        // Update DOM
        statTotalItems.textContent = total;
        statActiveLoans.textContent = activeLoans;
        statAvailableItems.textContent = available;
        statTotalLogs.textContent = totalLogs || 0;
    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

// 2. Active Loans Table Loader
async function loadActiveLoans() {
    try {
        const { data, error } = await supabase
            .from('borrow_logs')
            .select('*, items(name, category)')
            .eq('status', 'Dipinjam')
            .order('borrow_date', { ascending: false });

        if (error) throw error;

        activeLoansBody.innerHTML = '';
        if (data.length === 0) {
            activeLoansBody.innerHTML = `
                <tr class="table-empty">
                    <td colspan="6">Tidak ada peminjaman aktif saat ini.</td>
                </tr>
            `;
            return;
        }

        data.forEach(log => {
            const borrowDateStr = new Date(log.borrow_date).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(log.borrower_name)}</strong></td>
                <td>${escapeHtml(log.items ? log.items.name : 'Item Terhapus')}</td>
                <td><span class="badge-category">${escapeHtml(log.items ? log.items.category : '-')}</span></td>
                <td>${borrowDateStr}</td>
                <td><span class="status-badge badge-borrowed">Dipinjam</span></td>
                <td class="text-center">
                    <button class="btn-action-complete" onclick="handleReturn('${log.id}', '${log.item_id}', '${escapeHtml(log.items ? log.items.name : 'Item')}')">
                        Selesaikan Peminjaman
                    </button>
                </td>
            `;
            activeLoansBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading active loans:", err);
        activeLoansBody.innerHTML = `<tr class="table-error"><td colspan="6">Gagal memuat peminjaman aktif.</td></tr>`;
    }
}

// 3. Catalog Items Loader
async function loadCatalogItems(searchQuery = '') {
    try {
        let query = supabase
            .from('items')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (searchQuery.trim() !== '') {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        catalogItemsBody.innerHTML = '';
        if (data.length === 0) {
            catalogItemsBody.innerHTML = `
                <tr class="table-empty">
                    <td colspan="4">Tidak ada data inventaris.</td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td><span class="badge-category">${escapeHtml(item.category)}</span></td>
                <td>
                    <span class="status-badge ${item.is_available ? 'badge-available' : 'badge-borrowed'}">
                        ${item.is_available ? 'Tersedia' : 'Sedang Dipinjam'}
                    </span>
                </td>
                <td class="text-center" style="display: flex; justify-content: center; gap: 12px; align-items: center;">
                    <label class="switch" title="Ubah ketersediaan">
                        <input type="checkbox" ${item.is_available ? 'checked' : ''} onchange="handleToggleAvailability('${item.id}', this.checked, '${escapeHtml(item.name)}')">
                        <span class="slider"></span>
                    </label>
                    <button class="btn-icon-danger" title="Hapus Item" onclick="handleDeleteItem('${item.id}', '${escapeHtml(item.name)}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            catalogItemsBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading catalog:", err);
        catalogItemsBody.innerHTML = `<tr class="table-error"><td colspan="4">Gagal memuat inventaris.</td></tr>`;
    }
}

// Live search on catalog
catalogSearchInput.addEventListener('input', (e) => {
    loadCatalogItems(e.target.value);
});

// 4. All Logs Table Loader
async function loadAllLogs() {
    try {
        const { data, error } = await supabase
            .from('borrow_logs')
            .select('*, items(name, category)')
            .order('borrow_date', { ascending: false });

        if (error) throw error;

        allLogsBody.innerHTML = '';
        if (data.length === 0) {
            allLogsBody.innerHTML = `
                <tr class="table-empty">
                    <td colspan="5">Belum ada riwayat logs transaksi.</td>
                </tr>
            `;
            return;
        }

        data.forEach(log => {
            const borrowDateStr = new Date(log.borrow_date).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            const isReturned = log.status === 'Selesai';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(log.borrower_name)}</strong></td>
                <td>${escapeHtml(log.items ? log.items.name : 'Item Terhapus')}</td>
                <td><span class="badge-category">${escapeHtml(log.items ? log.items.category : '-')}</span></td>
                <td>${borrowDateStr}</td>
                <td>
                    <span class="status-badge ${isReturned ? 'badge-returned' : 'badge-borrowed'}">
                        ${log.status}
                    </span>
                </td>
            `;
            allLogsBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error loading logs:", err);
        allLogsBody.innerHTML = `<tr class="table-error"><td colspan="5">Gagal memuat riwayat logs.</td></tr>`;
    }
}

// ─── Action Handlers ───────────────────────────────────────────────────

// Complete Loan/Return Item Action
window.handleReturn = async function(logId, itemId, itemName) {
    if (!confirm(`Selesaikan peminjaman untuk "${itemName}"?`)) return;

    showLoader();
    try {
        // 1. Update borrow log status to 'Selesai'
        const { error: errLog } = await supabase
            .from('borrow_logs')
            .update({ status: 'Selesai' })
            .eq('id', logId);
        if (errLog) throw errLog;

        // 2. Set item as available (is_available = true)
        const { error: errItem } = await supabase
            .from('items')
            .update({ is_available: true })
            .eq('id', itemId);
        if (errItem) throw errItem;

        showToast(`Peminjaman "${itemName}" berhasil diselesaikan!`, "success");
    } catch (err) {
        console.error(err);
        showToast("Gagal menyelesaikan peminjaman.", "error");
    } finally {
        hideLoader();
    }
};

// Add New Item Action
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const category = itemCategorySelect.value;

    showLoader();
    try {
        const { error } = await supabase
            .from('items')
            .insert({ name, category, is_available: true });

        if (error) throw error;

        showToast(`"${name}" berhasil ditambahkan ke katalog!`, "success");
        addItemForm.reset();
    } catch (err) {
        console.error(err);
        showToast("Gagal menambahkan item baru.", "error");
    } finally {
        hideLoader();
    }
});

// Toggle Item Availability Status Action
window.handleToggleAvailability = async function(itemId, isChecked, itemName) {
    try {
        const { error } = await supabase
            .from('items')
            .update({ is_available: isChecked })
            .eq('id', itemId);

        if (error) throw error;
        
        const statusText = isChecked ? "Tersedia" : "Dipinjam";
        showToast(`Status "${itemName}" diubah menjadi: ${statusText}`, "success");
    } catch (err) {
        console.error(err);
        showToast("Gagal mengubah ketersediaan item.", "error");
        // Revert switch visually
        loadCatalogItems(catalogSearchInput.value);
    }
};

// Delete Item Action
window.handleDeleteItem = async function(itemId, itemName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${itemName}" dari katalog?`)) return;

    showLoader();
    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        showToast(`"${itemName}" berhasil dihapus dari katalog!`, "success");
    } catch (err) {
        console.error(err);
        showToast("Gagal menghapus item dari katalog.", "error");
    } finally {
        hideLoader();
    }
};

// ─── PDF Report Export ─────────────────────────────────────────────────
btnExportPdf.addEventListener('click', async () => {
    showLoader();
    try {
        const { data, error } = await supabase
            .from('borrow_logs')
            .select('*, items(name, category)')
            .order('borrow_date', { ascending: false });

        if (error) throw error;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Styled PDF details
        const primaryColor = [18, 18, 21]; // #121215
        const accentColor = [0, 200, 100];  // emerald green
        
        // Brand logo header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("PINJAMKUY", 15, 25);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text("LAPORAN BULANAN PEMINJAMAN INVENTARIS & RUANGAN", 15, 33);
        
        // Export Timestamp & Metadata
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // Muted grey
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 50);
        
        // Summary boxes
        const totalLogsCount = data.length;
        const activeLoansCount = data.filter(log => log.status === 'Dipinjam').length;
        const completedLoansCount = totalLogsCount - activeLoansCount;
        
        // Stats grid draw
        doc.setFillColor(243, 244, 246); // light grey stat boxes
        doc.rect(15, 58, 55, 20, 'F');
        doc.rect(77, 58, 55, 20, 'F');
        doc.rect(140, 58, 55, 20, 'F');
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...primaryColor);
        doc.text(totalLogsCount.toString(), 20, 66);
        doc.text(activeLoansCount.toString(), 82, 66);
        doc.text(completedLoansCount.toString(), 145, 66);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("TOTAL TRANSAKSI", 20, 72);
        doc.text("AKTIF DIPINJAM", 82, 72);
        doc.text("SELESAI DIKEMBALIKAN", 145, 72);
        
        // Data table formatting
        const tableHeaders = [["Nama Peminjam", "Nama Item", "Kategori", "Tanggal Pinjam", "Status"]];
        const tableRows = data.map(log => [
            log.borrower_name,
            log.items ? log.items.name : 'Item Terhapus',
            log.items ? log.items.category : '-',
            new Date(log.borrow_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            log.status
        ]);
        
        doc.autoTable({
            startY: 88,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                font: 'Helvetica',
                fontSize: 9,
                cellPadding: 4
            },
            columnStyles: {
                4: { fontStyle: 'bold' } // bold status column
            }
        });
        
        doc.save(`Laporan_Peminjaman_PinjamKuy_${new Date().toISOString().slice(0,10)}.pdf`);
        showToast("Laporan PDF berhasil diunduh!", "success");
    } catch (err) {
        console.error(err);
        showToast("Gagal mengekspor laporan PDF.", "error");
    } finally {
        hideLoader();
    }
});

// ─── Tab Navigation Logic ──────────────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Remove active classes from all nav items
        navItems.forEach(ni => ni.classList.remove('active'));
        
        // 2. Add active class to clicked item
        item.classList.add('active');
        
        // 3. Hide all tab content panes
        Object.values(tabs).forEach(tab => tab.classList.remove('active'));
        
        // 4. Show selected tab pane
        const selectedTabKey = item.getAttribute('data-tab');
        tabs[selectedTabKey].classList.add('active');
        
        // 5. Update header titles
        updateHeaderTitles(selectedTabKey);
    });
});

function updateHeaderTitles(tabKey) {
    if (tabKey === 'overview') {
        pageTitle.textContent = "Dashboard Ringkasan";
        pageSubtitle.textContent = "Selamat datang kembali di panel admin PinjamKuy.";
    } else if (tabKey === 'catalog') {
        pageTitle.textContent = "Kelola Inventaris & Ruangan";
        pageSubtitle.textContent = "Tambah, ubah ketersediaan, atau hapus item dari katalog peminjaman.";
    } else if (tabKey === 'logs') {
        pageTitle.textContent = "Laporan Log Transaksi";
        pageSubtitle.textContent = "Lihat seluruh riwayat transaksi peminjaman barang dan ruangan.";
    }
}

// ─── Utility Helpers ───────────────────────────────────────────────────
function showLoader() {
    appLoader.classList.remove('loader-hidden');
}

function hideLoader() {
    appLoader.classList.add('loader-hidden');
}

function showToast(message, type = "success") {
    Toastify({
        text: message,
        duration: 3500,
        close: true,
        gravity: "top",
        position: "right",
        className: type === "success" ? "toastify-success" : "toastify-error",
        stopOnFocus: true
    }).showToast();
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

// ─── Initial App Auth Run ──────────────────────────────────────────────
checkAuth();

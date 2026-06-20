// Activity Logs Page
function activityLogsPage() {
  const filters = {
    dateFrom: '',
    dateTo: '',
    action: 'all',
    entityType: 'all',
    search: ''
  };

  let logs = [];

  async function fetchLogs() {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.entityType !== 'all') params.append('entityType', filters.entityType);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_URL}/activity-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${API.session.token}` }
      });

      const data = await response.json();
      logs = data.logs || [];
      render();
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast('Failed to load activity logs', 'err');
    }
  }

  function render() {
    return `
      <div class="page-header-row">
        <div>
          <div class="page-title">Activity Logs</div>
          <div class="page-subtitle">Audit trail & system activity</div>
        </div>
        <button class="btn btn-sm" onclick="exportLogs()">
          ${ico('exp')} Export CSV
        </button>
      </div>

      <div class="card mb-3">
        <div class="card-b">
          <div class="form-grid form-4">
            <div class="fld">
              <label>From Date</label>
              <input type="date" id="dateFrom" value="${filters.dateFrom}" 
                     onchange="activityLogsModule.updateFilter('dateFrom', this.value)">
            </div>
            <div class="fld">
              <label>To Date</label>
              <input type="date" id="dateTo" value="${filters.dateTo}"
                     onchange="activityLogsModule.updateFilter('dateTo', this.value)">
            </div>
            <div class="fld">
              <label>Action</label>
              <select id="action" onchange="activityLogsModule.updateFilter('action', this.value)">
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="order_created">Order Created</option>
                <option value="order_paid">Order Paid</option>
                <option value="order_cancelled">Order Cancelled</option>
                <option value="refund">Refund</option>
                <option value="void">Void</option>
              </select>
            </div>
            <div class="fld">
              <label>Entity Type</label>
              <select id="entityType" onchange="activityLogsModule.updateFilter('entityType', this.value)">
                <option value="all">All Types</option>
                <option value="order">Orders</option>
                <option value="product">Products</option>
                <option value="user">Users</option>
                <option value="customer">Customers</option>
                <option value="inventory">Inventory</option>
                <option value="cost">Costs</option>
                <option value="settings">Settings</option>
              </select>
            </div>
          </div>
          <div class="form-grid mt-2">
            <div class="fld">
              <input type="text" placeholder="Search description..." id="search"
                     oninput="activityLogsModule.updateFilter('search', this.value)">
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h">
          <div class="card-t">Activity Timeline</div>
          <div class="card-actions">
            <span class="txt-muted">${logs.length} entries</span>
          </div>
        </div>
        <div class="card-b p-0">
          ${logs.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <div class="empty-title">No Activity Logs</div>
              <div class="empty-text">No logs found matching your filters</div>
            </div>
          ` : `
            <div class="activity-timeline">
              ${logs.map(log => renderLogEntry(log)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderLogEntry(log) {
    const actionColors = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      order_created: 'green',
      order_paid: 'green',
      order_cancelled: 'red',
      refund: 'orange',
      void: 'red'
    };

    const actionIcons = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      order_created: '🛒',
      order_paid: '💰',
      order_cancelled: '❌',
      refund: '↩️',
      void: '⛔'
    };

    const color = actionColors[log.action] || 'gray';
    const icon = actionIcons[log.action] || '📝';

    return `
      <div class="activity-entry">
        <div class="activity-dot activity-dot-${color}"></div>
        <div class="activity-content">
          <div class="activity-header">
            <div class="activity-icon">${icon}</div>
            <div class="activity-action badge-${color}">${log.action.toUpperCase()}</div>
            <div class="activity-entity">${log.entity_type}</div>
            <div class="activity-time">${formatDateTime(log.created_at)}</div>
          </div>
          <div class="activity-description">${log.description}</div>
          ${log.user_name ? `<div class="activity-user">By: ${log.user_name}</div>` : ''}
          ${log.metadata ? `
            <details class="activity-metadata">
              <summary>View Details</summary>
              <pre>${JSON.stringify(JSON.parse(log.metadata), null, 2)}</pre>
            </details>
          ` : ''}
        </div>
      </div>
    `;
  }

  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  function updateFilter(key, value) {
    filters[key] = value;
    fetchLogs();
  }

  function exportLogs() {
    const csv = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Description', 'User'],
      ...logs.map(log => [
        log.created_at,
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.description,
        log.user_name || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initial fetch
  fetchLogs();

  // Export for global access
  window.activityLogsModule = { updateFilter, exportLogs };

  return render();
}

// Add activity timeline styles
const activityStyles = document.createElement('style');
activityStyles.textContent = `
.activity-timeline {
  padding: 20px;
}

.activity-entry {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 24px;
}

.activity-entry:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: var(--brd);
}

.activity-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  border: 3px solid var(--sf);
  box-shadow: 0 0 0 2px var(--brd);
}

.activity-dot-green { background: var(--gn); }
.activity-dot-blue { background: var(--bl); }
.activity-dot-red { background: var(--rd); }
.activity-dot-orange { background: var(--or); }
.activity-dot-gray { background: var(--txt3); }

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.activity-icon {
  font-size: 18px;
}

.activity-action {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.activity-entity {
  font-size: 12px;
  font-weight: 600;
  color: var(--txt2);
  background: var(--sf2);
  padding: 3px 8px;
  border-radius: 4px;
}

.activity-time {
  font-size: 11px;
  color: var(--txt3);
  margin-left: auto;
}

.activity-description {
  font-size: 13px;
  color: var(--txt);
  margin-bottom: 4px;
}

.activity-user {
  font-size: 11px;
  color: var(--txt3);
}

.activity-metadata {
  margin-top: 8px;
  font-size: 11px;
}

.activity-metadata summary {
  cursor: pointer;
  color: var(--bl);
  font-weight: 600;
  padding: 4px 0;
}

.activity-metadata pre {
  background: var(--sf2);
  border: 1px solid var(--brd);
  border-radius: 6px;
  padding: 12px;
  margin-top: 6px;
  overflow-x: auto;
  font-family: var(--mo);
  font-size: 10px;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--txt);
  margin-bottom: 8px;
}

.empty-text {
  font-size: 13px;
  color: var(--txt3);
}
`;
document.head.appendChild(activityStyles);


// Register page
PAGES.activityLogs = function() {
  return activityLogsPage();
};

/**
 * NASHTY OS - Quick Access Grid
 * Displays favorites, recent items, and auto-suggest
 */

class QuickAccessGrid {
  constructor() {
    this.currentTab = 'favorites';
    this.collapsed = false;
    this.container = null;
  }

  init() {
    this.createUI();
    this.loadTab('favorites');
  }

  createUI() {
    // Check if already exists
    if (document.getElementById('quick-access-grid')) return;

    const container = document.createElement('div');
    container.id = 'quick-access-grid';
    container.className = 'quick-access-grid';
    container.innerHTML = `
      <div class="qa-header">
        <div class="qa-tabs">
          <button class="qa-tab active" data-tab="favorites">
            ⭐ Favorites
          </button>
          <button class="qa-tab" data-tab="recent">
            🕐 Recent
          </button>
          <button class="qa-tab" data-tab="suggest">
            🔥 Top Sold
          </button>
        </div>
        <button class="qa-collapse" onclick="window.QuickAccessGrid.toggle()">
          ${this.collapsed ? '→' : '←'}
        </button>
      </div>
      <div class="qa-body" id="qa-body">
        <!-- Content rendered here -->
      </div>
    `;

    // Add to app
    const app = document.querySelector('.app-shell') || document.body;
    app.appendChild(container);
    this.container = container;

    // Add event listeners
    container.querySelectorAll('.qa-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.loadTab(tabName);
      });
    });

    // Add styles
    this.addStyles();

    console.log('✅ QuickAccessGrid UI created');
  }

  loadTab(tabName) {
    this.currentTab = tabName;
    
    // Update active tab
    this.container.querySelectorAll('.qa-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Load content
    const body = document.getElementById('qa-body');
    if (!body) return;

    switch (tabName) {
      case 'favorites':
        this.renderFavorites(body);
        break;
      case 'recent':
        this.renderRecent(body);
        break;
      case 'suggest':
        this.renderSuggest(body);
        break;
    }
  }

  async renderFavorites(body) {
    body.innerHTML = '<div class="qa-loading">Loading favorites...</div>';

    try {
      const favorites = window.FavoritesManager.getFavorites();
      
      if (favorites.length === 0) {
        body.innerHTML = `
          <div class="qa-empty">
            <div style="font-size:48px;margin-bottom:12px;">⭐</div>
            <p>No favorites yet</p>
            <small>Right-click a product to add to favorites</small>
          </div>
        `;
        return;
      }

      let html = '<div class="qa-grid" id="qa-favorites-grid">';
      
      for (const fav of favorites) {
        const product = fav.products;
        html += `
          <div class="qa-item" 
               data-fav-id="${fav.id}" 
               data-product-id="${product.id}"
               draggable="true"
               ondragstart="window.QuickAccessGrid.onDragStart(event)"
               ondragover="window.QuickAccessGrid.onDragOver(event)"
               ondrop="window.QuickAccessGrid.onDrop(event)"
               onclick="window.QuickAccessGrid.addToCart('${product.id}')">
            <div class="qa-item-img" style="background-image:url('${product.image || '/placeholder.png'}')"></div>
            <div class="qa-item-name">${product.name}</div>
            <div class="qa-item-price">Rp ${this.formatPrice(product.price)}</div>
            <button class="qa-item-remove" onclick="event.stopPropagation();window.QuickAccessGrid.removeFavorite('${fav.id}')">×</button>
          </div>
        `;
      }
      
      html += '</div>';
      body.innerHTML = html;

    } catch (error) {
      console.error('Failed to render favorites:', error);
      body.innerHTML = '<div class="qa-error">Failed to load favorites</div>';
    }
  }

  async renderRecent(body) {
    body.innerHTML = '<div class="qa-loading">Loading recent items...</div>';
    
    try {
      const recent = await window.RecentItemsTracker?.getRecentItems() || [];
      
      if (recent.length === 0) {
        body.innerHTML = `
          <div class="qa-empty">
            <div style="font-size:48px;margin-bottom:12px;">🕐</div>
            <p>No recent items</p>
          </div>
        `;
        return;
      }

      let html = '<div class="qa-grid">';
      
      for (const item of recent) {
        const product = item.product;
        html += `
          <div class="qa-item" onclick="window.QuickAccessGrid.addToCart('${product.id}')">
            <div class="qa-item-img" style="background-image:url('${product.image || '/placeholder.png'}')"></div>
            <div class="qa-item-name">${product.name}</div>
            <div class="qa-item-price">Rp ${this.formatPrice(product.price)}</div>
            <div class="qa-item-badge">${item.count}x</div>
          </div>
        `;
      }
      
      html += '</div>';
      body.innerHTML = html;

    } catch (error) {
      console.error('Failed to render recent:', error);
      body.innerHTML = '<div class="qa-error">Failed to load recent items</div>';
    }
  }

  async renderSuggest(body) {
    body.innerHTML = '<div class="qa-loading">Loading top sellers...</div>';
    
    try {
      const topSold = await this.fetchTopSold();
      
      if (topSold.length === 0) {
        body.innerHTML = `
          <div class="qa-empty">
            <div style="font-size:48px;margin-bottom:12px;">🔥</div>
            <p>No data yet</p>
          </div>
        `;
        return;
      }

      let html = '<div class="qa-grid">';
      
      for (const item of topSold) {
        html += `
          <div class="qa-item" onclick="window.QuickAccessGrid.addToCart('${item.product_id}')">
            <div class="qa-item-img" style="background-image:url('${item.image || '/placeholder.png'}')"></div>
            <div class="qa-item-name">${item.name}</div>
            <div class="qa-item-price">Rp ${this.formatPrice(item.price)}</div>
            <div class="qa-item-badge trending">🔥 ${item.sales_count}</div>
          </div>
        `;
      }
      
      html += '</div>';
      body.innerHTML = html;

    } catch (error) {
      console.error('Failed to render top sold:', error);
      body.innerHTML = '<div class="qa-error">Failed to load top sellers</div>';
    }
  }

  async fetchTopSold() {
    // Placeholder - will be implemented with backend
    return [];
  }

  async addToCart(productId) {
    try {
      const product = await window.OfflineOrderHandler.getProduct(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Add to cart (assuming cart API exists)
      if (window.cart && typeof window.cart.addItem === 'function') {
        window.cart.addItem(product);
      } else if (window.addToCart) {
        window.addToCart(product);
      } else {
        console.warn('Cart API not found');
      }

      // Track as recent
      if (window.RecentItemsTracker) {
        await window.RecentItemsTracker.trackItem(productId);
      }

      // Show feedback
      this.showFeedback(`✅ ${product.name} added to cart`);

    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showFeedback('❌ Failed to add to cart', 'error');
    }
  }

  async removeFavorite(favoriteId) {
    try {
      await window.FavoritesManager.removeFavorite(favoriteId);
      this.loadTab('favorites'); // Refresh
      this.showFeedback('✅ Removed from favorites');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      this.showFeedback('❌ Failed to remove', 'error');
    }
  }

  // Drag and drop
  onDragStart(event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.innerHTML);
    event.target.classList.add('dragging');
  }

  onDragOver(event) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  async onDrop(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    }

    const dragging = document.querySelector('.dragging');
    const dropTarget = event.target.closest('.qa-item');
    
    if (!dragging || !dropTarget || dragging === dropTarget) {
      return false;
    }

    // Get IDs
    const dragId = dragging.dataset.favId;
    const dropId = dropTarget.dataset.favId;

    // Reorder in array
    const favorites = window.FavoritesManager.getFavorites();
    const dragIndex = favorites.findIndex(f => f.id === dragId);
    const dropIndex = favorites.findIndex(f => f.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newOrder = [...favorites];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    // Update positions
    const reorderData = newOrder.map((fav, index) => ({
      id: fav.id,
      position: index + 1
    }));

    await window.FavoritesManager.reorderFavorites(reorderData);
    
    // Refresh UI
    this.loadTab('favorites');

    dragging.classList.remove('dragging');
    return false;
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.container.classList.toggle('collapsed', this.collapsed);
    
    const btn = this.container.querySelector('.qa-collapse');
    if (btn) {
      btn.textContent = this.collapsed ? '→' : '←';
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
  }

  showFeedback(message, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  addStyles() {
    if (document.getElementById('qa-styles')) return;

    const style = document.createElement('style');
    style.id = 'qa-styles';
    style.textContent = `
      .quick-access-grid {
        position: fixed;
        right: 0;
        top: 60px;
        bottom: 0;
        width: 280px;
        background: var(--sf);
        border-left: 1px solid var(--brd);
        display: flex;
        flex-direction: column;
        transition: transform 0.3s;
        z-index: 100;
      }
      .quick-access-grid.collapsed {
        transform: translateX(280px);
      }
      .qa-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-bottom: 1px solid var(--brd);
      }
      .qa-tabs {
        display: flex;
        gap: 4px;
        flex: 1;
      }
      .qa-tab {
        flex: 1;
        padding: 8px 4px;
        background: var(--sf2);
        border: none;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        color: var(--txt2);
        transition: all 0.2s;
      }
      .qa-tab.active {
        background: var(--or);
        color: white;
        font-weight: 600;
      }
      .qa-collapse {
        padding: 8px 12px;
        background: var(--sf2);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        color: var(--txt2);
        font-size: 16px;
      }
      .qa-body {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      .qa-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .qa-item {
        position: relative;
        background: var(--sf2);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .qa-item:hover {
        background: var(--sf3);
        transform: translateY(-2px);
      }
      .qa-item.dragging {
        opacity: 0.5;
      }
      .qa-item-img {
        width: 100%;
        height: 80px;
        background-size: cover;
        background-position: center;
        border-radius: 6px;
        margin-bottom: 8px;
        background-color: var(--sf3);
      }
      .qa-item-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--txt);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .qa-item-price {
        font-size: 11px;
        color: var(--or);
        font-weight: 600;
      }
      .qa-item-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: var(--sf);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        color: var(--txt2);
      }
      .qa-item-badge.trending {
        background: var(--or);
        color: white;
      }
      .qa-item-remove {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        background: var(--rd);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qa-loading, .qa-empty, .qa-error {
        text-align: center;
        padding: 40px 20px;
        color: var(--txt3);
        font-size: 13px;
      }
      .qa-empty small {
        display: block;
        margin-top: 8px;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);
  }
}

window.QuickAccessGrid = new QuickAccessGrid();
console.log('✅ QuickAccessGrid loaded');

// Pagination Helper Module
// Reusable pagination utilities for consistent pagination across modules

const Pagination = {
  /**
   * Calculate pagination metadata
   * @param {number} total - Total number of records
   * @param {number} page - Current page (1-indexed)
   * @param {number} limit - Records per page
   * @returns {object} Pagination metadata
   */
  getMeta(total, page = 1, limit = 20) {
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.max(1, Math.min(parseInt(page), totalPages));
    
    return {
      page: currentPage,
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      startIndex: (currentPage - 1) * limit,
      endIndex: Math.min(currentPage * limit, total)
    };
  },

  /**
   * Render pagination UI
   * @param {object} meta - Pagination metadata from getMeta()
   * @param {string} onPageChange - JavaScript function name to call on page change
   * @returns {string} HTML string for pagination UI
   */
  render(meta, onPageChange = 'changePage') {
    const { page, totalPages, total, startIndex, endIndex, hasNext, hasPrev } = meta;
    
    // Generate page numbers to show
    const pageNumbers = this._getPageNumbers(page, totalPages);
    
    return `
      <div class="pagination">
        <div class="pg-info">
          Showing ${startIndex + 1}-${endIndex} of ${total}
        </div>
        <div class="pg-controls">
          <button 
            class="pg-btn ${!hasPrev ? 'disabled' : ''}" 
            ${!hasPrev ? 'disabled' : ''}
            onclick="${onPageChange}(${page - 1})">
            ← Prev
          </button>
          
          ${pageNumbers.map(num => {
            if (num === '...') {
              return `<span class="pg-ellipsis">...</span>`;
            }
            return `
              <button 
                class="pg-btn ${num === page ? 'active' : ''}"
                onclick="${onPageChange}(${num})">
                ${num}
              </button>
            `;
          }).join('')}
          
          <button 
            class="pg-btn ${!hasNext ? 'disabled' : ''}"
            ${!hasNext ? 'disabled' : ''}
            onclick="${onPageChange}(${page + 1})">
            Next →
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Get array of page numbers to display
   * Shows: 1 ... 4 5 [6] 7 8 ... 20
   * @private
   */
  _getPageNumbers(current, total) {
    if (total <= 7) {
      // Show all pages
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let start = Math.max(2, current - 2);
    let end = Math.min(total - 1, current + 2);
    
    // Adjust if at edges
    if (current <= 4) {
      end = 5;
    } else if (current >= total - 3) {
      start = total - 4;
    }
    
    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push('...');
    }
    
    // Add page range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis after range if needed
    if (end < total - 1) {
      pages.push('...');
    }
    
    // Always show last page
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  },

  /**
   * Create paginated subset of data
   * @param {Array} data - Full dataset
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {object} { data: paginatedData, meta: paginationMeta }
   */
  paginate(data, page = 1, limit = 20) {
    const meta = this.getMeta(data.length, page, limit);
    const paginatedData = data.slice(meta.startIndex, meta.endIndex);
    
    return {
      data: paginatedData,
      meta
    };
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Pagination = Pagination;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pagination;
}

/**
 * ============================================================================
 * GLOBAL ERROR HANDLER - Nashty System
 * ============================================================================
 * Purpose: Centralized error handling with user-friendly messages
 * Usage: Import and wrap all API calls
 * ============================================================================
 */

const ErrorHandler = {
  /**
   * Error codes with Indonesian messages
   */
  messages: {
    // Network errors
    'NETWORK_ERROR': 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
    'TIMEOUT_ERROR': 'Request timeout. Server tidak merespons.',
    'OFFLINE': 'Anda sedang offline. Beberapa fitur mungkin tidak tersedia.',
    
    // Authentication errors
    'AUTH_FAILED': 'Login gagal. Periksa username/password Anda.',
    'AUTH_EXPIRED': 'Sesi Anda telah berakhir. Silakan login kembali.',
    'AUTH_UNAUTHORIZED': 'Anda tidak memiliki akses ke fitur ini.',
    
    // Validation errors
    'VALIDATION_ERROR': 'Data yang dimasukkan tidak valid.',
    'REQUIRED_FIELD': 'Harap isi semua field yang wajib.',
    'INVALID_FORMAT': 'Format data tidak sesuai.',
    
    // Business logic errors
    'ORDER_CREATE_FAILED': 'Gagal membuat pesanan. Silakan coba lagi.',
    'ORDER_UPDATE_FAILED': 'Gagal memperbarui pesanan.',
    'PRODUCT_NOT_FOUND': 'Produk tidak ditemukan.',
    'INSUFFICIENT_STOCK': 'Stok produk tidak mencukupi.',
    'PAYMENT_FAILED': 'Pembayaran gagal diproses.',
    
    // Server errors
    'SERVER_ERROR': 'Terjadi kesalahan pada server. Tim kami akan segera memperbaikinya.',
    'DATABASE_ERROR': 'Terjadi kesalahan database. Silakan coba lagi.',
    
    // Unknown
    'UNKNOWN_ERROR': 'Terjadi kesalahan yang tidak diketahui.'
  },

  /**
   * Handle API errors and show user-friendly message
   */
  handle(error, context = {}) {
    console.error(`[Error in ${context.feature || 'Unknown'}]:`, error);
    
    let message = this.messages.UNKNOWN_ERROR;
    let code = 'UNKNOWN_ERROR';
    
    // Detect error type
    if (!navigator.onLine) {
      code = 'OFFLINE';
      message = this.messages.OFFLINE;
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      code = 'NETWORK_ERROR';
      message = this.messages.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      code = 'TIMEOUT_ERROR';
      message = this.messages.TIMEOUT_ERROR;
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      code = 'AUTH_UNAUTHORIZED';
      message = this.messages.AUTH_UNAUTHORIZED;
    } else if (error.message.includes('403')) {
      code = 'AUTH_EXPIRED';
      message = this.messages.AUTH_EXPIRED;
    } else if (error.message.includes('404')) {
      message = context.notFoundMessage || 'Data tidak ditemukan.';
    } else if (error.message.includes('500')) {
      code = 'SERVER_ERROR';
      message = this.messages.SERVER_ERROR;
    } else if (error.code && this.messages[error.code]) {
      code = error.code;
      message = this.messages[error.code];
    } else if (error.message) {
      message = error.message;
    }
    
    // Show toast notification
    if (typeof toast === 'function') {
      toast(message, 'err');
    } else if (typeof alert === 'function') {
      alert('⚠️ ' + message);
    }
    
    // Log to monitoring service (if available)
    this.logError(code, error, context);
    
    return {
      code,
      message,
      originalError: error
    };
  },

  /**
   * Wrap async function with error handling
   */
  async wrap(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error; // Re-throw so caller can handle if needed
    }
  },

  /**
   * Log error to monitoring service
   */
  logError(code, error, context) {
    // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
    const logEntry = {
      timestamp: new Date().toISOString(),
      code,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      user: window.API?.session?.user?.id || 'anonymous'
    };
    
    // For now, just console.log
    // In production, send to monitoring service
    console.warn('[Error Log]:', logEntry);
    
    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('nashty_errors') || '[]');
      errors.push(logEntry);
      // Keep only last 50 errors
      if (errors.length > 50) errors.shift();
      localStorage.setItem('nashty_errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  },

  /**
   * Validate required fields
   */
  validateRequired(data, requiredFields) {
    const missing = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    });
    
    if (missing.length > 0) {
      const fieldNames = missing.join(', ');
      throw new Error(`Field wajib diisi: ${fieldNames}`);
    }
    
    return true;
  },

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Format nomor telepon tidak valid. Contoh: 081234567890');
    }
    return true;
  },

  /**
   * Validate email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format email tidak valid');
    }
    return true;
  },

  /**
   * Validate number (positive)
   */
  validateNumber(value, fieldName = 'Nilai') {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} harus berupa angka positif`);
    }
    return true;
  },

  /**
   * Retry function with exponential backoff
   */
  async retry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoffMultiplier = 2,
      onRetry = null
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
          
          if (onRetry) onRetry(attempt, waitTime);
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}

// Make globally available
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}

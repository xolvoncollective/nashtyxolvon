/**
 * NASHTY OS - Encryption Service
 * AES-256-GCM encryption for sensitive offline data
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits recommended for GCM
    this.keys = new Map(); // userId -> CryptoKey
  }

  /**
   * Derive encryption key from session token and device ID
   */
  async deriveKey(userId, sessionToken) {
    try {
      const deviceId = await this.getDeviceId();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(sessionToken + deviceId),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(userId),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        false, // Not extractable
        ['encrypt', 'decrypt']
      );

      this.keys.set(userId, key);
      console.log(`✅ Encryption key derived for user ${userId}`);
      return key;
    } catch (error) {
      console.error('Failed to derive encryption key:', error);
      throw error;
    }
  }

  /**
   * Get or create persistent device ID
   */
  async getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem('deviceId', deviceId);
      console.log('✅ New device ID generated:', deviceId);
    }
    return deviceId;
  }

  /**
   * Encrypt data (returns base64-encoded string)
   */
  async encrypt(userId, plaintext) {
    const key = this.keys.get(userId);
    if (!key) {
      throw new Error('Encryption key not initialized for user');
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      const encodedData = new TextEncoder().encode(plaintext);

      const ciphertext = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        encodedData
      );

      // Combine IV + ciphertext for storage
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data (from base64-encoded string)
   */
  async decrypt(userId, encryptedData) {
    const key = this.keys.get(userId);
    if (!key) {
      throw new Error('Decryption key not initialized for user');
    }

    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      const iv = combined.slice(0, this.ivLength);
      const ciphertext = combined.slice(this.ivLength);

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Encrypt sensitive order fields
   */
  async encryptOrder(userId, order) {
    const sensitiveFields = {
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      paymentCardLast4: order.paymentCardLast4 || '',
      paymentDetails: order.paymentDetails || {}
    };

    const encryptedFields = await this.encrypt(
      userId,
      JSON.stringify(sensitiveFields)
    );

    return {
      ...order,
      customerName: '[ENCRYPTED]',
      customerPhone: '[ENCRYPTED]',
      customerEmail: '[ENCRYPTED]',
      paymentCardLast4: '[ENCRYPTED]',
      paymentDetails: '[ENCRYPTED]',
      _encrypted: encryptedFields
    };
  }

  /**
   * Decrypt sensitive order fields
   */
  async decryptOrder(userId, order) {
    if (!order._encrypted) {
      return order;
    }

    try {
      const decryptedFields = JSON.parse(
        await this.decrypt(userId, order._encrypted)
      );

      const { _encrypted, ...orderWithoutEncrypted } = order;
      return {
        ...orderWithoutEncrypted,
        ...decryptedFields
      };
    } catch (error) {
      console.error('Failed to decrypt order:', error);
      return order; // Return as-is if decryption fails
    }
  }

  /**
   * Clear keys on logout
   */
  clearKeys(userId) {
    if (userId) {
      this.keys.delete(userId);
      console.log(`🔒 Encryption key cleared for user ${userId}`);
    } else {
      this.keys.clear();
      console.log('🔒 All encryption keys cleared');
    }
  }

  // Utility methods
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Initialize and export
window.EncryptionService = new EncryptionService();
console.log('✅ EncryptionService module loaded');

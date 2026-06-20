/**
 * NASHTY OS - Encryption Service
 * Uses Web Crypto API with AES-256-GCM for encrypting sensitive data
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
   * Uses PBKDF2 with 100,000 iterations
   */
  async deriveKey(userId, sessionToken) {
    try {
      const deviceId = await this.getDeviceId();
      
      // Import key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(sessionToken + deviceId),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive actual encryption key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(userId),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        false, // Not extractable (security)
        ['encrypt', 'decrypt']
      );

      this.keys.set(userId, key);
      console.log('EncryptionService: Key derived for user:', userId);
      return key;
    } catch (error) {
      console.error('EncryptionService: Key derivation failed:', error);
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
      console.log('EncryptionService: New device ID generated:', deviceId);
    }
    return deviceId;
  }

  /**
   * Encrypt data (returns base64-encoded string)
   */
  async encrypt(userId, plaintext) {
    try {
      const key = this.keys.get(userId);
      if (!key) {
        throw new Error('Encryption key not initialized for user: ' + userId);
      }

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encode plaintext
      const encodedData = new TextEncoder().encode(plaintext);

      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        encodedData
      );

      // Combine IV + ciphertext for storage
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      // Convert to base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('EncryptionService: Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data (from base64-encoded string)
   */
  async decrypt(userId, encryptedData) {
    try {
      const key = this.keys.get(userId);
      if (!key) {
        throw new Error('Decryption key not initialized for user: ' + userId);
      }

      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Extract IV and ciphertext
      const iv = combined.slice(0, this.ivLength);
      const ciphertext = combined.slice(this.ivLength);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        ciphertext
      );

      // Decode to string
      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('EncryptionService: Decryption failed:', error);
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Encrypt sensitive order fields
   */
  async encryptOrder(userId, order) {
    try {
      // Extract sensitive fields
      const sensitiveFields = {
        customerName: order.customerName || null,
        customerPhone: order.customerPhone || null,
        customerEmail: order.customerEmail || null,
        paymentCardLast4: order.paymentCardLast4 || null,
        paymentDetails: order.paymentDetails || null,
        notes: order.notes || null
      };

      // Encrypt sensitive data
      const encryptedFields = await this.encrypt(
        userId,
        JSON.stringify(sensitiveFields)
      );

      // Return order with encrypted fields
      return {
        ...order,
        customerName: '[ENCRYPTED]',
        customerPhone: '[ENCRYPTED]',
        customerEmail: '[ENCRYPTED]',
        paymentCardLast4: '[ENCRYPTED]',
        paymentDetails: '[ENCRYPTED]',
        notes: '[ENCRYPTED]',
        _encrypted: encryptedFields
      };
    } catch (error) {
      console.error('EncryptionService: Order encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive order fields
   */
  async decryptOrder(userId, order) {
    try {
      if (!order._encrypted) {
        return order;
      }

      // Decrypt sensitive data
      const decryptedFields = JSON.parse(
        await this.decrypt(userId, order._encrypted)
      );

      // Return order with decrypted fields
      return {
        ...order,
        ...decryptedFields,
        _encrypted: undefined
      };
    } catch (error) {
      console.error('EncryptionService: Order decryption failed:', error);
      throw error;
    }
  }

  /**
   * Clear keys on logout (security)
   */
  clearKeys(userId = null) {
    if (userId) {
      this.keys.delete(userId);
      console.log('EncryptionService: Keys cleared for user:', userId);
    } else {
      this.keys.clear();
      console.log('EncryptionService: All keys cleared');
    }
  }

  /**
   * Test encryption/decryption
   */
  async test(userId, sessionToken) {
    try {
      console.log('EncryptionService: Running test...');
      
      // Derive key
      await this.deriveKey(userId, sessionToken);
      
      // Test data
      const testData = {
        customerName: 'John Doe',
        customerPhone: '+62812345678',
        paymentCardLast4: '1234'
      };
      
      // Encrypt
      const encrypted = await this.encrypt(userId, JSON.stringify(testData));
      console.log('EncryptionService: Encrypted:', encrypted.substring(0, 50) + '...');
      
      // Decrypt
      const decrypted = JSON.parse(await this.decrypt(userId, encrypted));
      console.log('EncryptionService: Decrypted:', decrypted);
      
      // Verify
      const isValid = JSON.stringify(testData) === JSON.stringify(decrypted);
      console.log('EncryptionService: Test', isValid ? 'PASSED ✓' : 'FAILED ✗');
      
      return isValid;
    } catch (error) {
      console.error('EncryptionService: Test failed:', error);
      return false;
    }
  }

  // ── Utility Methods ──

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

// Export singleton instance
window.EncryptionService = new EncryptionService();

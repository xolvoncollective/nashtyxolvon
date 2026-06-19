import { get, run } from '../db/database';

export class ProductService {
  /**
   * Checks if a product has sufficient stock.
   */
  static checkAvailability(productId: string, requestedQty: number) {
    const product = get('SELECT price, stock_tracking, stock_qty, name FROM products WHERE id = ?', [productId]) as any;
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found or unavailable.`);
    }

    if (product.stock_tracking === 1 && product.stock_qty < requestedQty) {
      throw new Error(`Stok tidak mencukupi untuk ${product.name}. Sisa stok: ${product.stock_qty}`);
    }

    return product;
  }

  /**
   * Deducts stock for a product if tracking is enabled.
   */
  static deductStock(productId: string, quantity: number, orderNumber: string = 'Order') {
    const product = get('SELECT tenant_id, name, stock_tracking, stock_qty FROM products WHERE id = ?', [productId]) as any;
    if (product && product.stock_tracking === 1) {
       run(`
         UPDATE products SET stock_qty = stock_qty - ?, updated_at = ?
         WHERE id = ?
       `, [quantity, new Date().toISOString(), productId]);
       
       const crypto = require('crypto');
       run(`
         INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
         VALUES (?, ?, 'update', 'inventory', ?, ?)
       `, [crypto.randomUUID(), product.tenant_id, productId, `Stock dikurangi ${quantity} untuk ${product.name} (${orderNumber})`]);
    }
  }

  /**
   * Restores stock for a product if tracking is enabled.
   */
  static restoreStock(productId: string, quantity: number, reason: string = 'Void/Refund') {
    const product = get('SELECT tenant_id, name, stock_tracking, stock_qty FROM products WHERE id = ?', [productId]) as any;
    if (product && product.stock_tracking === 1) {
       run(`
         UPDATE products SET stock_qty = stock_qty + ?, updated_at = ?
         WHERE id = ?
       `, [quantity, new Date().toISOString(), productId]);

       const crypto = require('crypto');
       run(`
         INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
         VALUES (?, ?, 'update', 'inventory', ?, ?)
       `, [crypto.randomUUID(), product.tenant_id, productId, `Stock dikembalikan ${quantity} untuk ${product.name} (${reason})`]);
    }
  }
}

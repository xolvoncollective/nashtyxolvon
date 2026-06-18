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
  static deductStock(productId: string, quantity: number) {
    const product = get('SELECT stock_tracking FROM products WHERE id = ?', [productId]) as any;
    if (product && product.stock_tracking === 1) {
       run(`
         UPDATE products SET stock_qty = stock_qty - ?, updated_at = ?
         WHERE id = ?
       `, [quantity, new Date().toISOString(), productId]);
    }
  }

  /**
   * Restores stock for a product if tracking is enabled.
   */
  static restoreStock(productId: string, quantity: number) {
    const product = get('SELECT stock_tracking FROM products WHERE id = ?', [productId]) as any;
    if (product && product.stock_tracking === 1) {
       run(`
         UPDATE products SET stock_qty = stock_qty + ?, updated_at = ?
         WHERE id = ?
       `, [quantity, new Date().toISOString(), productId]);
    }
  }
}

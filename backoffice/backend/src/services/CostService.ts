import { get, run, transaction } from '../db/database';
import { nanoid } from 'nanoid';

export class CostService {
  /**
   * Add new ingredient (Bahan)
   */
  static addBahan(data: any) {
    const id = nanoid();
    run(`INSERT INTO cost_bahan (id, tenant_id, nama, kategori, harga_beli, satuan, yield_pct, stok) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
         [id, data.tenantId, data.nama, data.kategori, data.harga_beli || 0, data.satuan, data.yield_pct || 1, data.stok || 0]);
    return id;
  }

  /**
   * Update ingredient and record price history if changed
   */
  static updateBahan(id: string, tenantId: string, data: any) {
    const oldBahan = get('SELECT * FROM cost_bahan WHERE id = ? AND tenant_id = ?', [id, tenantId]) as any;
    if (!oldBahan) throw new Error('Bahan not found');

    const doTransaction = transaction(() => {
      // Record price history if price changed
      if (data.harga_beli !== undefined && data.harga_beli !== oldBahan.harga_beli) {
        run(`INSERT INTO cost_riwayat_harga (id, tenant_id, bahan_id, bahan_nama, harga_lama, harga_baru, delta)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
             [nanoid(), tenantId, id, oldBahan.nama, oldBahan.harga_beli, data.harga_beli, data.harga_beli - oldBahan.harga_beli]);
      }

      run(`UPDATE cost_bahan SET 
             nama = COALESCE(?, nama), 
             kategori = COALESCE(?, kategori), 
             harga_beli = COALESCE(?, harga_beli), 
             satuan = COALESCE(?, satuan), 
             yield_pct = COALESCE(?, yield_pct), 
             stok = COALESCE(?, stok),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = ?`, 
             [data.nama, data.kategori, data.harga_beli, data.satuan, data.yield_pct, data.stok, id, tenantId]);
    });
    
    doTransaction();
  }

  /**
   * Add new recipe
   */
  static addRecipe(data: any) {
    const id = nanoid();
    const doTransaction = transaction(() => {
      run(`INSERT INTO cost_recipes (id, tenant_id, nama, kategori, hpp_total, harga_jual, food_cost_pct, margin, chef_penanggung) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
           [id, data.tenantId, data.nama, data.kategori, data.hpp_total || 0, data.harga_jual || 0, data.food_cost_pct || 0, data.margin || 0, data.chef_penanggung]);
      
      this.syncRecipeCost(data.tenantId, data.nama, data.hpp_total || 0);
    });
    doTransaction();
    return id;
  }

  /**
   * Update recipe and sync its cost to products table
   */
  static updateRecipe(id: string, tenantId: string, data: any) {
    const doTransaction = transaction(() => {
      run(`UPDATE cost_recipes SET 
             nama = COALESCE(?, nama), 
             kategori = COALESCE(?, kategori), 
             hpp_total = COALESCE(?, hpp_total), 
             harga_jual = COALESCE(?, harga_jual), 
             food_cost_pct = COALESCE(?, food_cost_pct), 
             margin = COALESCE(?, margin),
             chef_penanggung = COALESCE(?, chef_penanggung),
             status = COALESCE(?, status),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = ?`, 
             [data.nama, data.kategori, data.hpp_total, data.harga_jual, data.food_cost_pct, data.margin, data.chef_penanggung, data.status, id, tenantId]);

      if (data.hpp_total !== undefined) {
        // Find the recipe name to sync
        const recipe = get('SELECT nama FROM cost_recipes WHERE id = ? AND tenant_id = ?', [id, tenantId]) as any;
        if (recipe) {
          this.syncRecipeCost(tenantId, recipe.nama, data.hpp_total);
        }
      }
    });
    doTransaction();
  }

  /**
   * Synchronize Recipe Cost to Product Cost (Wave 5 Integration)
   */
  static syncRecipeCost(tenantId: string, recipeName: string, hppTotal: number) {
    // We assume recipe nama matches product name. We update the product's cost field.
    run(`UPDATE products SET cost = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ? AND tenant_id = ?`, [hppTotal, recipeName, tenantId]);
  }
}

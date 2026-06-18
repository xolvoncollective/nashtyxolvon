import { get, run, transaction } from '../db/database';
import { insert } from '../db/persistence';
import crypto from 'crypto';

export class MemberService {
  /**
   * Validates or auto-registers a CRM customer.
   */
  static validateOrRegisterMember(tenantId: string, phone: string, name?: string) {
    let customer = get('SELECT * FROM crm_customers WHERE phone = ? AND tenant_id = ? AND deleted_at IS NULL', [phone, tenantId]) as any;

    if (!customer) {
      const customerId = crypto.randomUUID();

      insert('crm_customers', {
        id: customerId,
        tenant_id: tenantId,
        name: name || 'Customer Baru',
        phone,
        points: 0,
        total_spent: 0,
        visit_count: 0
      });

      customer = get('SELECT * FROM crm_customers WHERE id = ?', [customerId]);
    }

    return customer;
  }

  /**
   * Handles point transaction for a CRM customer.
   */
  static handlePointTransaction(tenantId: string, customerId: string, points: number, type: 'earn' | 'redeem', description: string) {
    const id = crypto.randomUUID();
  
    const doTransaction = transaction(() => {
        // 1. Insert transaction
        run(`INSERT INTO crm_point_transactions (id, tenant_id, customer_id, points, type, description) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [id, tenantId, customerId, points || 0, type || 'earn', description]);
                
        // 2. Update customer's total points
        if (type === 'earn') {
            run(`UPDATE crm_customers SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, 
                   [points, customerId, tenantId]);
        } else if (type === 'redeem') {
            run(`UPDATE crm_customers SET points = points - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, 
                   [points, customerId, tenantId]);
        }
    });

    doTransaction();
    return id;
  }
}

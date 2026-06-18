import { query } from '../db/database';

export class SettingsService {
  /**
   * Resolves settings for an outlet, falling back to tenant settings.
   */
  static resolveSettings(tenantId: string, outletId: string | null) {
    const settings = query(`
      SELECT key, value, type FROM settings
      WHERE (tenant_id = ? AND outlet_id = ?) OR (tenant_id = ? AND outlet_id IS NULL)
    `, [tenantId, outletId, tenantId]) as any[];

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      if (s.type === 'boolean') settingsMap[s.key] = s.value === 'true';
      else if (s.type === 'number') settingsMap[s.key] = Number(s.value);
      else if (s.type === 'json') {
        try {
          settingsMap[s.key] = JSON.parse(s.value);
        } catch {
          settingsMap[s.key] = s.value;
        }
      }
      else settingsMap[s.key] = s.value;
    }
    
    return settingsMap;
  }

  static getTaxAndServiceChargeRate(tenantId: string, outletId: string | null) {
    const settingsMap = this.resolveSettings(tenantId, outletId);
    const taxRate = settingsMap.tax_enabled !== false ? (settingsMap.tax_rate || 11) : 0;
    const scRate = settingsMap.service_charge_enabled ? (settingsMap.service_charge_rate || 0) : 0;
    return { taxRate, scRate };
  }
}

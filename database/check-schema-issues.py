import psycopg2
import json

# Database connection - using direct connection
conn_params = {
    "host": "db.mzucfndifneytbesirkx.supabase.co",
    "database": "postgres",
    "user": "postgres",
    "password": "ZaidunkMargin",
    "port": "5432"
}

try:
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    print("=" * 80)
    print("CHECKING SCHEMA AND DATA INTEGRITY")
    print("=" * 80)
    
    # 1. Check system_users structure and data
    print("\n1. SYSTEM_USERS TABLE:")
    print("-" * 80)
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'system_users'
        ORDER BY ordinal_position
    """)
    print("Columns:")
    for row in cur.fetchall():
        print(f"  {row[0]:20} | {row[1]:15} | nullable: {row[2]:5} | default: {row[3]}")
    
    cur.execute("SELECT COUNT(*) FROM system_users WHERE is_active = true")
    active_count = cur.fetchone()[0]
    print(f"\nActive system_users: {active_count}")
    
    cur.execute("SELECT username, role, is_active FROM system_users WHERE role IN ('superadmin', 'owner', 'manager') LIMIT 5")
    print("\nSample backoffice users:")
    for row in cur.fetchall():
        print(f"  {row[0]:20} | {row[1]:15} | active: {row[2]}")
    
    # 2. Check users (POS) structure
    print("\n2. USERS TABLE (POS):")
    print("-" * 80)
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
    """)
    print("Columns:")
    for row in cur.fetchall():
        print(f"  {row[0]:20} | {row[1]:15} | nullable: {row[2]:5} | default: {row[3]}")
    
    cur.execute("SELECT COUNT(*) FROM users WHERE status = 'active'")
    active_pos = cur.fetchone()[0]
    print(f"\nActive POS users: {active_pos}")
    
    cur.execute("SELECT name, pin, role, outlet_id FROM users WHERE status = 'active' LIMIT 5")
    print("\nSample POS users:")
    for row in cur.fetchall():
        print(f"  {row[0]:20} | PIN: {row[1]:6} | {row[2]:10} | outlet: {row[3]}")
    
    # 3. Check outlets
    print("\n3. OUTLETS TABLE:")
    print("-" * 80)
    cur.execute("SELECT id, name, tenant_id FROM outlets")
    print("Available outlets:")
    for row in cur.fetchall():
        print(f"  {row[0]} | {row[1]:30} | tenant: {row[2]}")
    
    # 4. Check foreign key constraints
    print("\n4. FOREIGN KEY CONSTRAINTS:")
    print("-" * 80)
    cur.execute("""
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name IN ('system_users', 'users', 'outlets', 'orders', 'order_items', 'payments')
        ORDER BY tc.table_name
    """)
    
    for row in cur.fetchall():
        print(f"  {row[0]:20} . {row[1]:20} -> {row[2]:20} . {row[3]}")
    
    # 5. Check for orphaned records
    print("\n5. CHECKING FOR ORPHANED RECORDS:")
    print("-" * 80)
    
    # Check users without valid outlet_id
    cur.execute("""
        SELECT COUNT(*) 
        FROM users u 
        LEFT JOIN outlets o ON u.outlet_id = o.id 
        WHERE o.id IS NULL AND u.outlet_id IS NOT NULL
    """)
    orphaned_users = cur.fetchone()[0]
    print(f"  Users with invalid outlet_id: {orphaned_users}")
    
    # Check orders without valid outlet_id
    cur.execute("""
        SELECT COUNT(*) 
        FROM orders ord 
        LEFT JOIN outlets o ON ord.outlet_id = o.id 
        WHERE o.id IS NULL
    """)
    orphaned_orders = cur.fetchone()[0]
    print(f"  Orders with invalid outlet_id: {orphaned_orders}")
    
    # Check order_items without valid order_id
    cur.execute("""
        SELECT COUNT(*) 
        FROM order_items oi 
        LEFT JOIN orders o ON oi.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphaned_items = cur.fetchone()[0]
    print(f"  Order_items with invalid order_id: {orphaned_items}")
    
    # Check order_items without valid product_id
    cur.execute("""
        SELECT COUNT(*) 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE p.id IS NULL
    """)
    orphaned_products = cur.fetchone()[0]
    print(f"  Order_items with invalid product_id: {orphaned_products}")
    
    # 6. Check payments
    cur.execute("""
        SELECT COUNT(*) 
        FROM payments pay 
        LEFT JOIN orders o ON pay.order_id = o.id 
        WHERE o.id IS NULL
    """)
    orphaned_payments = cur.fetchone()[0]
    print(f"  Payments with invalid order_id: {orphaned_payments}")
    
    # 7. Test login credentials
    print("\n6. TESTING LOGIN CREDENTIALS:")
    print("-" * 80)
    
    # Test superadmin
    cur.execute("""
        SELECT id, username, role, is_active, tenant_id 
        FROM system_users 
        WHERE username = 'superadmin'
    """)
    superadmin = cur.fetchone()
    if superadmin:
        print(f"  ✓ Superadmin found: {superadmin[1]} | role: {superadmin[2]} | active: {superadmin[3]}")
    else:
        print("  ✗ Superadmin NOT FOUND")
    
    # Test POS PIN
    cur.execute("""
        SELECT id, name, pin, outlet_id, status 
        FROM users 
        WHERE pin IN ('1111', '2222', '3333')
        LIMIT 3
    """)
    print("\n  Sample POS PINs:")
    for row in cur.fetchall():
        print(f"    {row[1]:20} | PIN: {row[2]:6} | outlet: {row[3]} | {row[4]}")
    
    # 8. Summary
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print("=" * 80)
    
    issues = []
    if active_count == 0:
        issues.append("❌ No active system_users found")
    else:
        print(f"✓ {active_count} active system_users")
    
    if active_pos == 0:
        issues.append("❌ No active POS users found")
    else:
        print(f"✓ {active_pos} active POS users")
    
    if orphaned_users > 0:
        issues.append(f"❌ {orphaned_users} users with invalid outlet_id")
    
    if orphaned_orders > 0:
        issues.append(f"❌ {orphaned_orders} orders with invalid outlet_id")
    
    if orphaned_items > 0:
        issues.append(f"❌ {orphaned_items} order_items with invalid order_id")
    
    if orphaned_products > 0:
        issues.append(f"❌ {orphaned_products} order_items with invalid product_id")
    
    if orphaned_payments > 0:
        issues.append(f"❌ {orphaned_payments} payments with invalid order_id")
    
    if not superadmin:
        issues.append("❌ Superadmin user not found")
    
    if issues:
        print("\nISSUES FOUND:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✓ No orphaned records or integrity issues found")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

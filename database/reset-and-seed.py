#!/usr/bin/env python3
"""
RESET & SEED DATABASE - COMPLETE WORKFLOW
Drops all data, resets sequences, then seeds with realistic data
"""
import psycopg2
import sys
from datetime import datetime

conn_str = "postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

print("=" * 80)
print("NASHTY OS - DATABASE RESET & SEED")
print("=" * 80)
print("\nWARNING: This will DELETE ALL DATA in the database!")
print("\nPress ENTER to continue, or Ctrl+C to cancel...")
try:
    input()
except KeyboardInterrupt:
    print("\n\n❌ Cancelled by user")
    sys.exit(0)

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = False
    cur = conn.cursor()
    
    # Step 1: Get table order (respecting foreign keys)
    print("\n" + "=" * 80)
    print("STEP 1: Analyzing table dependencies...")
    print("=" * 80)
    
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    all_tables = [row[0] for row in cur.fetchall()]
    print(f"Found {len(all_tables)} tables")
    
    # Step 2: Truncate all tables (cascade will handle dependencies)
    print("\n" + "=" * 80)
    print("STEP 2: Truncating all tables...")
    print("=" * 80)
    
    # Proper deletion order (child -> parent)
    deletion_order = [
        # Transaction details first
        'order_item_modifiers',
        'order_items',
        'payments',
        
        # Orders and related
        'orders',
        'shifts',
        
        # Product configuration
        'product_modifiers',
        'favorites',
        
        # Master data
        'modifier_options',
        'modifier_groups',
        'products',
        'categories',
        'payment_methods',
        'stations',
        
        # Users and access
        'user_sessions',
        'user_outlet_access',
        'user_system_access',
        'token_blacklist',
        'users',
        'system_users',
        'staff',
        
        # Members and costs
        'members',
        'nashtycosts',
        
        # Settings
        'outlet_settings',
        'settings',
        'analytics_cache',
        'activity_logs',
        
        # Core hierarchy
        'outlets',
        'tenants',
    ]
    
    for table in deletion_order:
        try:
            print(f"  Truncating: {table}...")
            cur.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
        except Exception as e:
            print(f"    ⚠️ Warning: {e}")
    
    conn.commit()
    print("OK: All tables truncated")
    
    # Step 3: Read and execute seed file
    print("\n" + "=" * 80)
    print("STEP 3: Loading seed data...")
    print("=" * 80)
    
    with open('database/SEED_COMBINED_ALL.sql', 'r', encoding='utf-8') as f:
        seed_sql = f.read()
    
    print(f"  Seed file size: {len(seed_sql):,} bytes")
    print("  Executing seed SQL...")
    
    try:
        cur.execute(seed_sql)
        conn.commit()
        print("OK: Seed data inserted")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ SEED ERROR: {e}")
        
        # Try to get more details
        print("\nAttempting to identify problematic line...")
        lines = seed_sql.split('\n')
        for i, line in enumerate(lines[:100], 1):
            if 'INSERT INTO tenants' in line:
                print(f"\nLine {i}: {line}")
        
        raise
    
    # Step 4: Verify data
    print("\n" + "=" * 80)
    print("STEP 4: Verifying seeded data...")
    print("=" * 80)
    
    verification_tables = [
        'tenants', 'outlets', 'system_users', 'users', 
        'categories', 'products', 'payment_methods', 
        'members', 'orders'
    ]
    
    for table in verification_tables:
        cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        count = cur.fetchone()[0]
        print(f"  {table:<25} {count:>6} rows")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 80)
    print("SUCCESS: DATABASE RESET & SEED COMPLETE!")
    print("=" * 80)
    print("\nLogin credentials:")
    print("  Superadmin: superadmin@nashty / nashty1111")
    print("  Admin: admin / admin")
    print("  Kasir: 8888 (PIN)")
    print("  Owner: 9999 (PIN)")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    try:
        conn.rollback()
    except:
        pass

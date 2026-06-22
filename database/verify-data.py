#!/usr/bin/env python3
"""
Verify seeded data with detailed statistics
"""
import psycopg2
from datetime import datetime

conn_str = "postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

print("=" * 80)
print("DATABASE VERIFICATION - Detailed Statistics")
print("=" * 80)

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Basic counts
    print("\n📊 TABLE COUNTS:")
    print("-" * 80)
    
    tables = [
        ('tenants', 'Tenants'),
        ('outlets', 'Outlets'),
        ('system_users', 'System Users (Backoffice)'),
        ('users', 'POS Users (Cashiers)'),
        ('categories', 'Product Categories'),
        ('products', 'Products'),
        ('modifier_groups', 'Modifier Groups'),
        ('modifier_options', 'Modifier Options'),
        ('payment_methods', 'Payment Methods'),
        ('stations', 'Kitchen Stations'),
        ('members', 'Loyalty Members'),
        ('nashtycosts', 'Operational Costs'),
        ('orders', 'Orders'),
        ('order_items', 'Order Items'),
        ('payments', 'Payments'),
    ]
    
    for table, label in tables:
        cur.execute(f'SELECT COUNT(*) FROM {table}')
        count = cur.fetchone()[0]
        print(f"  {label:<35} {count:>6} rows")
    
    # Order statistics
    print("\n" + "=" * 80)
    print("🛒 ORDER STATISTICS:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            order_type,
            COUNT(*) as count,
            ROUND(AVG(total)) as avg_total,
            SUM(total) as total_revenue
        FROM orders
        GROUP BY order_type
        ORDER BY count DESC
    """)
    
    print(f"\n  {'Order Type':<15} {'Count':<10} {'Avg Total':<15} {'Total Revenue':<20}")
    print("  " + "-" * 60)
    for row in cur.fetchall():
        print(f"  {row[0]:<15} {row[1]:<10} Rp {row[2]:>10,.0f}   Rp {row[3]:>15,.0f}")
    
    # Payment method stats
    print("\n" + "=" * 80)
    print("💳 PAYMENT METHOD STATISTICS:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            payment_method,
            COUNT(*) as count,
            ROUND(SUM(total)) as total_amount
        FROM orders
        GROUP BY payment_method
        ORDER BY count DESC
    """)
    
    print(f"\n  {'Payment Method':<15} {'Count':<10} {'Total Amount':<20}")
    print("  " + "-" * 45)
    for row in cur.fetchall():
        print(f"  {row[0]:<15} {row[1]:<10} Rp {row[2]:>15,.0f}")
    
    # Top products
    print("\n" + "=" * 80)
    print("🍗 TOP 10 PRODUCTS:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            p.name,
            COUNT(oi.id) as order_count,
            SUM(oi.quantity) as total_qty,
            ROUND(SUM(oi.subtotal)) as total_revenue
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        GROUP BY p.id, p.name
        ORDER BY order_count DESC
        LIMIT 10
    """)
    
    print(f"\n  {'Product':<35} {'Orders':<10} {'Qty':<10} {'Revenue':<20}")
    print("  " + "-" * 75)
    for row in cur.fetchall():
        print(f"  {row[0]:<35} {row[1]:<10} {row[2]:<10} Rp {row[3]:>15,.0f}")
    
    # Member segments
    print("\n" + "=" * 80)
    print("👥 MEMBER STATISTICS:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            segment,
            COUNT(*) as count,
            ROUND(AVG(points)) as avg_points,
            ROUND(AVG(total_spent)) as avg_spent
        FROM members
        GROUP BY segment
        ORDER BY 
            CASE segment
                WHEN 'vip' THEN 1
                WHEN 'gold' THEN 2
                WHEN 'silver' THEN 3
            END
    """)
    
    print(f"\n  {'Segment':<10} {'Count':<10} {'Avg Points':<15} {'Avg Spent':<20}")
    print("  " + "-" * 55)
    for row in cur.fetchall():
        print(f"  {row[0]:<10} {row[1]:<10} {row[2]:>10,.0f}     Rp {row[3]:>15,.0f}")
    
    # Outlet performance
    print("\n" + "=" * 80)
    print("🏪 OUTLET PERFORMANCE:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            o.name,
            COUNT(ord.id) as order_count,
            ROUND(SUM(ord.total)) as total_revenue,
            ROUND(AVG(ord.total)) as avg_order
        FROM outlets o
        LEFT JOIN orders ord ON o.id = ord.outlet_id
        GROUP BY o.id, o.name
        ORDER BY total_revenue DESC
    """)
    
    print(f"\n  {'Outlet':<30} {'Orders':<10} {'Revenue':<20} {'Avg Order':<15}")
    print("  " + "-" * 75)
    for row in cur.fetchall():
        print(f"  {row[0]:<30} {row[1]:<10} Rp {row[2]:>15,.0f}   Rp {row[3]:>10,.0f}")
    
    # Date range
    print("\n" + "=" * 80)
    print("📅 DATA DATE RANGE:")
    print("-" * 80)
    
    cur.execute("""
        SELECT 
            MIN(created_at)::DATE as first_order,
            MAX(created_at)::DATE as last_order,
            EXTRACT(DAY FROM MAX(created_at) - MIN(created_at)) as days_span
        FROM orders
    """)
    
    row = cur.fetchone()
    print(f"\n  First Order : {row[0]}")
    print(f"  Last Order  : {row[1]}")
    print(f"  Days Span   : {row[2]:.0f} days")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 80)
    print("SUCCESS: Database verification complete!")
    print("=" * 80)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

#!/usr/bin/env python3
"""
Extract actual database schema from Supabase
"""
import psycopg2
import json

# Connection string
conn_str = "postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Get tenants table columns
    print("=" * 80)
    print("TENANTS TABLE COLUMNS:")
    print("=" * 80)
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tenants'
        ORDER BY ordinal_position;
    """)
    tenants_cols = cur.fetchall()
    for col in tenants_cols:
        print(f"  {col[0]:<30} {col[1]:<20} NULL:{col[2]:<3} DEFAULT:{col[3]}")
    
    # Get all public tables
    print("\n" + "=" * 80)
    print("ALL PUBLIC TABLES:")
    print("=" * 80)
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    
    # For each table, get columns
    all_schema = {}
    for (table_name,) in tables:
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        cols = cur.fetchall()
        all_schema[table_name] = [
            {
                'column': col[0],
                'type': col[1],
                'nullable': col[2],
                'default': col[3]
            }
            for col in cols
        ]
        print(f"\n{table_name}:")
        for col in cols:
            print(f"  - {col[0]} ({col[1]})")
    
    # Save to JSON
    with open('database/actual-schema.json', 'w', encoding='utf-8') as f:
        json.dump(all_schema, f, indent=2, default=str)
    
    print("\n" + "=" * 80)
    print("Schema saved to: database/actual-schema.json")
    print("=" * 80)
    
    cur.close()
    conn.close()
    print("\n✅ SUCCESS")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

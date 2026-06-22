#!/usr/bin/env python3
"""
Full database backup using Python (since pg_dump not installed)
"""
import psycopg2
import json
from datetime import datetime

conn_str = "postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

print("=" * 80)
print("NASHTY OS - FULL DATABASE BACKUP")
print("=" * 80)

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Get all public tables
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    
    backup_data = {
        'backup_date': datetime.now().isoformat(),
        'tables': {}
    }
    
    # For each table, get all data
    for table in tables:
        print(f"Backing up: {table}...")
        cur.execute(f'SELECT * FROM "{table}"')
        
        # Get column names
        colnames = [desc[0] for desc in cur.description]
        
        # Get all rows
        rows = cur.fetchall()
        
        backup_data['tables'][table] = {
            'columns': colnames,
            'row_count': len(rows),
            'rows': [dict(zip(colnames, row)) for row in rows]
        }
        
        print(f"  ✓ {len(rows)} rows backed up")
    
    # Save to JSON
    filename = f"database/nashty-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, default=str)
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 80)
    print(f"✅ BACKUP COMPLETE: {filename}")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

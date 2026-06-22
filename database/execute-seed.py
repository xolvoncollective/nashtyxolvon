#!/usr/bin/env python3
"""
Nashty OS - Automatic Seed Executor
Executes all seed files to Supabase PostgreSQL database
"""

import psycopg2
import os
import sys
import time
from datetime import datetime

# Supabase connection (direct connection)
DB_CONFIG = {
    'host': 'db.mzucfndifneytbesirkx.supabase.co',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'ZaidunkMargin'
}

# Seed files in execution order
SEED_FILES = [
    'SEED_MASTER_REALISTIC.sql',
    'SEED_PART2_PRODUCTS.sql',
    'SEED_PART2B_BEVERAGES.sql',
    'SEED_PART2C_EXTRAS.sql',
    'SEED_PART3_MEMBERS_COSTS.sql',
    'SEED_PART4_ORDERS.sql'
]

def print_header():
    print("╔════════════════════════════════════════════════════════╗")
    print("║         NASHTY OS - AUTOMATIC SEED EXECUTOR           ║")
    print("╚════════════════════════════════════════════════════════╝")
    print(f"\n🎯 Target: {DB_CONFIG['host']}")
    print(f"📦 Files: {len(SEED_FILES)}")
    print(f"🕐 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def execute_sql_file(conn, file_path):
    """Execute a SQL file"""
    file_name = os.path.basename(file_path)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print(f"\n📄 Reading: {file_name}")
        print(f"⚡ Executing SQL ({len(sql) / 1024:.1f} KB)...")
        
        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()
        cursor.close()
        
        print(f"✅ {file_name} executed successfully")
        return True
        
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return False
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error in {file_name}:")
        print(f"   {str(e)[:200]}")
        conn.rollback()
        return False
    except Exception as e:
        print(f"❌ Exception in {file_name}:")
        print(f"   {str(e)[:200]}")
        conn.rollback()
        return False

def verify_connection():
    """Test database connection"""
    print("\n🔌 Testing connection...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        print(f"✅ Connected successfully")
        print(f"   {version[:80]}...")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def execute_seeds():
    """Main execution function"""
    print_header()
    
    # Verify connection first
    if not verify_connection():
        print("\n💥 Cannot connect to database. Check credentials.")
        return False
    
    # Connect to database
    print("\n🚀 Starting seed execution...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Database connection established")
    except Exception as e:
        print(f"❌ Failed to connect: {str(e)}")
        return False
    
    start_time = time.time()
    success_count = 0
    fail_count = 0
    
    # Execute each seed file
    for i, file_name in enumerate(SEED_FILES, 1):
        print(f"\n{'='*60}")
        print(f"[{i}/{len(SEED_FILES)}] {file_name}")
        print(f"{'='*60}")
        
        file_path = os.path.join(os.path.dirname(__file__), file_name)
        
        if execute_sql_file(conn, file_path):
            success_count += 1
        else:
            fail_count += 1
            print("\n⚠️  Continuing with next file...")
        
        # Small delay between files
        if i < len(SEED_FILES):
            time.sleep(0.5)
    
    # Close connection
    conn.close()
    
    # Print summary
    duration = time.time() - start_time
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║                   EXECUTION COMPLETE                   ║")
    print("╚════════════════════════════════════════════════════════╝")
    print(f"\n📊 Results:")
    print(f"   ✅ Success: {success_count}/{len(SEED_FILES)}")
    print(f"   ❌ Failed:  {fail_count}/{len(SEED_FILES)}")
    print(f"   ⏱️  Time:    {duration:.1f}s")
    
    if fail_count > 0:
        print("\n⚠️  Some files failed. Check errors above.")
        return False
    
    print("\n🎉 All seed data executed successfully!")
    print("\n📝 Next steps:")
    print("   1. Login to backoffice: cashier.citra / nashty@2024")
    print("   2. Login to POS with PIN: 1234, 2345, 3456, 4567, 5678")
    print("   3. Check database for 3000-5000 orders over 90 days")
    print("   4. Verify 300 members and 95 products")
    
    return True

if __name__ == '__main__':
    try:
        success = execute_seeds()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Execution interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Fatal error: {str(e)}")
        sys.exit(1)

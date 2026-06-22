#!/usr/bin/env python3
"""
Audit SEED file against actual database schema and generate fixes
"""
import psycopg2
import re
import json

conn_str = "postgresql://postgres.mzucfndifneytbesirkx:ZaidunkMargin@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

print("=" * 80)
print("SEED FILE SCHEMA VALIDATOR")
print("=" * 80)

# Load actual schema
with open('database/actual-schema.json', 'r') as f:
    actual_schema = json.load(f)

# Read seed file
with open('database/SEED_COMBINED_ALL.sql', 'r', encoding='utf-8') as f:
    seed_content = f.read()

# Find all INSERT INTO statements
insert_pattern = r'INSERT INTO (\w+)\s*\(([^)]+)\)'
matches = re.findall(insert_pattern, seed_content, re.MULTILINE)

print("\nAuditing INSERT statements...\n")

errors = []
warnings = []

for table_name, columns_str in matches:
    # Parse columns from INSERT
    insert_cols = [c.strip() for c in columns_str.split(',')]
    
    # Get actual columns from schema
    if table_name not in actual_schema:
        errors.append(f"❌ Table '{table_name}' not found in database")
        continue
    
    actual_cols = [col['column'] for col in actual_schema[table_name]]
    
    # Check for missing or extra columns
    extra_cols = [c for c in insert_cols if c not in actual_cols]
    
    if extra_cols:
        errors.append(f"❌ Table '{table_name}' - Extra columns in INSERT: {', '.join(extra_cols)}")
        print(f"\n{table_name}:")
        print(f"  INSERT has: {', '.join(insert_cols)}")
        print(f"  Schema has: {', '.join(actual_cols)}")
        print(f"  ❌ EXTRA: {', '.join(extra_cols)}")
    else:
        print(f"✓ {table_name}: OK ({len(insert_cols)} columns)")

if errors:
    print("\n" + "=" * 80)
    print("ERRORS FOUND:")
    print("=" * 80)
    for err in errors:
        print(err)
    print("\n" + "=" * 80)
    print("RECOMMENDED FIXES:")
    print("=" * 80)
    
    # Generate fixes
    for table_name, columns_str in matches:
        if table_name not in actual_schema:
            continue
        
        insert_cols = [c.strip() for c in columns_str.split(',')]
        actual_cols = [col['column'] for col in actual_schema[table_name]]
        extra_cols = [c for c in insert_cols if c not in actual_cols]
        
        if extra_cols:
            fixed_cols = [c for c in insert_cols if c in actual_cols]
            print(f"\n{table_name}:")
            print(f"  REMOVE: {', '.join(extra_cols)}")
            print(f"  NEW INSERT: INSERT INTO {table_name} ({', '.join(fixed_cols)})")
else:
    print("\n" + "=" * 80)
    print("✅ ALL INSERT STATEMENTS MATCH SCHEMA!")
    print("=" * 80)

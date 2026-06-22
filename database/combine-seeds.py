#!/usr/bin/env python3
"""
Combine all seed SQL files into one for Supabase SQL Editor
"""

import os

seed_files = [
    'SEED_MASTER_REALISTIC.sql',
    'SEED_PART2_PRODUCTS.sql',
    'SEED_PART2B_BEVERAGES.sql',
    'SEED_PART2C_EXTRAS.sql',
    'SEED_PART3_MEMBERS_COSTS.sql',
    'SEED_PART4_ORDERS.sql'
]

output = []
output.append("-- ============================================================================")
output.append("-- NASHTY OS - COMPLETE SEED DATA (ALL IN ONE)")
output.append("-- ============================================================================")
output.append("-- Copy and paste this entire file into Supabase SQL Editor")
output.append("-- Execution time: 2-3 minutes")
output.append("-- ============================================================================\n")

for i, filename in enumerate(seed_files, 1):
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    output.append(f"\n\n-- ╔══════════════════════════════════════════════════════════════════════════╗")
    output.append(f"-- ║ PART {i}/6: {filename}")
    output.append(f"-- ╚══════════════════════════════════════════════════════════════════════════╝\n")
    output.append(content)
    
    print(f"✅ Added: {filename} ({len(content)/1024:.1f} KB)")

combined = '\n'.join(output)

# Save to file
output_file = os.path.join(os.path.dirname(__file__), 'SEED_COMBINED_ALL.sql')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(combined)

print(f"\n✅ Combined file created: SEED_COMBINED_ALL.sql")
print(f"📦 Total size: {len(combined)/1024:.1f} KB")
print(f"\n📋 Next steps:")
print(f"1. Open Supabase Dashboard → SQL Editor")
print(f"2. Create new query")
print(f"3. Copy-paste contents of SEED_COMBINED_ALL.sql")
print(f"4. Click 'Run' (may take 2-3 minutes)")
print(f"5. Wait for success message")

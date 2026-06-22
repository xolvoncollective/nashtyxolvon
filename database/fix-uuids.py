#!/usr/bin/env python3
"""
Auto-fix all invalid UUIDs in seed file
"""
import re

print("=" * 80)
print("AUTO-FIX INVALID UUIDs")
print("=" * 80)

with open('database/SEED_COMBINED_ALL.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all invalid UUID prefixes (p, m, g, o -> a, b, c, d)
replacements = [
    (r"'p([0-9]{7})-", r"'a\1-"),   # products
    (r"'mg([0-9]{6})-", r"'bc\1-"), # modifier groups
    (r"'mo([0-9]{6})-", r"'bd\1-"), # modifier options
    (r"'pm([0-9]{6})-", r"'ab\1-"), # payment methods
    (r"'st([0-9]{6})-", r"'cd\1-"), # stations
    (r"'mb([0-9]{6})-", r"'be\1-"), # members
    (r"'o([0-9]{7})-", r"'d\1-"),   # orders
]

count = 0
for pattern, replacement in replacements:
    content, n = re.subn(pattern, replacement, content)
    if n > 0:
        print(f"  Fixed {n} occurrences: {pattern} -> {replacement}")
        count += n

# Write back
with open('database/SEED_COMBINED_ALL.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "=" * 80)
print(f"✅ Fixed {count} invalid UUIDs")
print("=" * 80)

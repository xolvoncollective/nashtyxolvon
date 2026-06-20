import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Fix PINs in Supabase - Hash existing plain text PINs
 */
async function fixPins() {
  console.log('🔧 Fixing PINs in Supabase...\n');

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log(`📋 Found ${users?.length || 0} users\n`);

    if (!users || users.length === 0) {
      console.log('⚠️  No users found. Run seed-supabase.ts first!');
      return;
    }

    // Check if PINs are already hashed (bcrypt hashes start with $2)
    const needsUpdate = users.filter(u => u.pin && !u.pin.startsWith('$2'));
    
    if (needsUpdate.length === 0) {
      console.log('✅ All PINs are already hashed!');
      return;
    }

    console.log(`🔨 Updating ${needsUpdate.length} users with plain text PINs:\n`);

    // Known test PINs (you can add more)
    const testPins: Record<string, string> = {
      '1234': '1234',
      '2345': '2345', 
      '3456': '3456',
      '4567': '4567',
      '0000': '0000'
    };

    for (const user of needsUpdate) {
      let pinToHash = user.pin;
      
      // If PIN looks suspicious or is missing, use fallback
      if (!pinToHash || pinToHash.length > 6) {
        console.log(`   ⚠️  User ${user.name}: Invalid PIN, using default '1234'`);
        pinToHash = '1234';
      }

      const hashedPin = bcrypt.hashSync(pinToHash, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          pin: hashedPin,
          password_hash: hashedPin
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${user.name}:`, updateError.message);
      } else {
        console.log(`   ✅ Updated ${user.name} - PIN: ${pinToHash} (Role: ${user.role})`);
      }
    }

    console.log('\n✅ PIN fix completed!\n');
    console.log('🧪 Test PINs:');
    console.log('   • 1234 - Admin User (Owner)');
    console.log('   • 2345 - Manager User');
    console.log('   • 3456 - Cashier User');
    console.log('   • 4567 - Chef User (Kitchen)');

  } catch (error: any) {
    console.error('\n❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixPins();

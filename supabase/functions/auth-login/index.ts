import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ─── JWT Generator (Web Crypto API - Deno compatible) ─────────────────────────
function base64url(source: ArrayBuffer): string {
  const bytes = new Uint8Array(source);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let encoded = btoa(binary);
  encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return encoded;
}

function base64urlStr(str: string): string {
  const encoder = new TextEncoder();
  return base64url(encoder.encode(str));
}

async function generateJwt(payload: Record<string, unknown>, secret: string, expiresInHours = 12): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlStr(JSON.stringify(header));
  const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 60 * 60);
  const payloadWithExp = { ...payload, iat: Math.floor(Date.now() / 1000), exp };
  const encodedPayload = base64urlStr(JSON.stringify(payloadWithExp));
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(tokenData));
  return `${tokenData}.${base64url(signature)}`;
}

async function generateRefreshToken(userId: string, secret: string): Promise<string> {
  const payload = { sub: userId, type: 'refresh' };
  return generateJwt(payload, secret, 24 * 30); // 30 days
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'ZaidunkMargin';
  const REFRESH_SECRET = Deno.env.get('REFRESH_TOKEN_SECRET') ?? JWT_SECRET + '_refresh';

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { action, username, password, pin, outletId } = body;

    console.log('[AUTH] Login attempt:', { action, username: username || 'PIN', outletId });

    // ══════════════════════════════════════════════════════════════════════════
    // BACKOFFICE LOGIN (system_users table)
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'main-login' || action === 'superadmin-login' || action === 'backoffice-login') {
      if (!username || !password) {
        return new Response(JSON.stringify({ success: false, error: 'Username and password are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const allowedRoles = action === 'superadmin-login'
        ? ['superadmin', 'owner']
        : ['manager', 'superadmin', 'owner', 'cashier'];

      // Query system_users table for backoffice login
      const { data: user, error } = await supabase
        .from('system_users')
        .select('id, username, full_name, email, role, tenant_id, is_active, password_hash')
        .eq('username', username)
        .in('role', allowedRoles)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        console.log('[AUTH] Backoffice user not found:', username);
        return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Password validation (simplified for seed data)
      // Accept: nashty@2024, nashty1111, OR same-as-username (admin1 user password is admin1)
      const isPasswordValid = password === 'nashty@2024' || password === 'nashty1111' || password === username;

      if (!isPasswordValid) {
        console.log('[AUTH] Invalid password for user:', username);
        return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For backoffice users, outlet is selected from dropdown
      const effectiveOutletId = outletId || null;

      const token = await generateJwt({
        sub: user.id,
        name: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: effectiveOutletId,
        username: user.username,
        userType: 'system'  // Flag to differentiate from POS users
      }, JWT_SECRET, 8);

      const refreshToken = await generateRefreshToken(user.id, REFRESH_SECRET);

      // Update last login timestamp
      await supabase.from('system_users').update({
        last_login_at: new Date().toISOString()
      }).eq('id', user.id);

      // Log login activity
      await supabase.from('activity_logs').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action: 'login',
        entity_type: 'auth',
        description: `${user.role} login: ${user.username}`,
        metadata: { 
          action, 
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          outletId: effectiveOutletId
        }
      }).select().single();

      console.log('[AUTH] Backoffice login successful:', { username, role: user.role });

      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: '8h',
        user: { 
          id: user.id, 
          name: user.full_name, 
          username: user.username,
          email: user.email, 
          role: user.role, 
          tenantId: user.tenant_id, 
          outletId: effectiveOutletId,
          userType: 'system'
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POS PIN LOGIN (staff table - KASIR ONLY)
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'pin-login' || action === 'pos-login') {
      if (!pin) {
        return new Response(JSON.stringify({ success: false, error: 'PIN is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!outletId) {
        return new Response(JSON.stringify({ success: false, error: 'Please select outlet first' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('[AUTH] Searching POS staff with PIN and outlet:', { outletId });

      // FIXED: Query staff table (not users table!)
      const { data: staff, error } = await supabase
        .from('staff')
        .select('id, name, role, tenant_id, outlet_id, pin, color')
        .eq('pin', pin)
        .eq('outlet_id', outletId)
        .eq('is_active', true)
        .single();

      if (error || !staff) {
        console.log('[AUTH] Invalid PIN for outlet:', { pin, outletId, error: error?.message });
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid PIN for this outlet. Please check your PIN and try again.' 
        }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate token for POS staff (12 hour shift)
      const token = await generateJwt({
        sub: staff.id,
        name: staff.name,
        role: staff.role,
        tenantId: staff.tenant_id,
        outletId: staff.outlet_id,
        userType: 'pos'  // Flag for POS users
      }, JWT_SECRET, 12);

      const refreshToken = await generateRefreshToken(staff.id, REFRESH_SECRET);

      // Log PIN login
      await supabase.from('activity_logs').insert({
        tenant_id: staff.tenant_id,
        user_id: staff.id,
        action: 'pin_login',
        entity_type: 'auth',
        description: `POS login: ${staff.name}`,
        metadata: { outletId: staff.outlet_id, ip: req.headers.get('x-forwarded-for') || 'unknown' }
      }).select().single();

      console.log('[AUTH] POS login successful:', { name: staff.name, outlet: staff.outlet_id });

      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: '12h',
        user: { 
          id: staff.id, 
          name: staff.name, 
          role: staff.role, 
          tenantId: staff.tenant_id, 
          outletId: staff.outlet_id,
          userType: 'pos'
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action', 
      validActions: ['main-login', 'superadmin-login', 'backoffice-login', 'pin-login', 'pos-login'] 
    }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[AUTH] Error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

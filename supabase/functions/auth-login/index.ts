import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // ─── Main Login (manager/superadmin) ────────────────────────────────────
    if (action === 'main-login' || action === 'superadmin-login') {
      const loginEmail = username === 'admin1' ? 'admin@nashty' : username;
      const allowedRoles = action === 'superadmin-login'
        ? ['superadmin', 'owner', 'manager']
        : ['manager', 'superadmin', 'owner'];

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, tenant_id, outlet_id, status, password')
        .eq('email', loginEmail)
        .in('role', allowedRoles)
        .single();

      if (error || !user || user.password !== password) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user.status === 'inactive') {
        return new Response(JSON.stringify({ success: false, error: 'Account is inactive' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const effectiveOutletId = outletId || user.outlet_id;

      const token = await generateJwt({
        sub: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: effectiveOutletId
      }, JWT_SECRET, 1); // 1 hour access token

      const refreshToken = await generateRefreshToken(user.id, REFRESH_SECRET);

      // Log login activity
      await supabase.from('activity_logs').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'user_login',
        entity_type: 'auth',
        metadata: { action, ip: req.headers.get('x-forwarded-for') || 'unknown' }
      });

      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: '1h',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── PIN Login (cashier/staff) ───────────────────────────────────────────
    if (action === 'pin-login') {
      if (!pin) {
        return new Response(JSON.stringify({ success: false, error: 'PIN is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let q = supabase
        .from('users')
        .select('id, name, role, tenant_id, outlet_id, status, pin')
        .eq('pin', pin);

      if (outletId) q = q.eq('outlet_id', outletId);

      const { data: user, error } = await q.single();

      if (error || !user) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid PIN' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user.status === 'inactive') {
        return new Response(JSON.stringify({ success: false, error: 'User account is inactive' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const effectiveOutletId = outletId || user.outlet_id;

      const token = await generateJwt({
        sub: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: effectiveOutletId
      }, JWT_SECRET, 12); // 12 hour shift token

      const refreshToken = await generateRefreshToken(user.id, REFRESH_SECRET);

      // Log PIN login
      await supabase.from('activity_logs').insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action_type: 'pin_login',
        entity_type: 'auth',
        metadata: { outletId: effectiveOutletId }
      });

      return new Response(JSON.stringify({
        success: true,
        token,
        refreshToken,
        expiresIn: '12h',
        user: { id: user.id, name: user.name, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: main-login, superadmin-login, or pin-login' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Auth login error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', message: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

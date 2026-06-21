import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

function base64url(source) {
  let encodedSource = btoa(String.fromCharCode.apply(null, new Uint8Array(source)));
  encodedSource = encodedSource.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return encodedSource;
}

function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

async function generateJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(stringToUint8Array(JSON.stringify(header)));
  
  const exp = Math.floor(Date.now() / 1000) + (12 * 60 * 60); // 12 hours
  const payloadWithExp = { ...payload, exp };
  const encodedPayload = base64url(stringToUint8Array(JSON.stringify(payloadWithExp)));
  
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    stringToUint8Array(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, stringToUint8Array(tokenData));
  const encodedSignature = base64url(signature);
  
  return `${tokenData}.${encodedSignature}`;
}

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const JWT_SECRET = env.JWT_SECRET || 'fallback_secret_only_for_dev_change_me';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, username, password, pin, outletId } = await request.json();

    if (action === 'main-login') {
      const loginEmail = username === 'admin1' ? 'admin@nashty' : username;
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', loginEmail)
        .in('role', ['manager', 'superadmin'])
        .single();

      if (error || !user || user.password !== password) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const token = await generateJwt({
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: outletId
      }, JWT_SECRET);

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: user.id, username: user.email, role: user.role, tenantId: user.tenant_id, outletId }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } 
    
    if (action === 'pin-login') {
      let query = supabase
        .from('users')
        .select('*')
        .eq('pin', pin);
      
      if (outletId) query = query.eq('outlet_id', outletId);
      
      const { data: user, error } = await query.single();

      if (error || !user || user.status === 'inactive') {
        return new Response(JSON.stringify({ success: false, error: 'Invalid PIN or inactive user' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const token = await generateJwt({
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: outletId || user.outlet_id
      }, JWT_SECRET);

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: user.id, name: user.name, role: user.role, tenantId: user.tenant_id, outletId: outletId || user.outlet_id }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'superadmin-login') {
       const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', username)
        .in('role', ['superadmin', 'owner', 'manager'])
        .single();

      if (error || !user || user.password !== password) {
        return new Response(JSON.stringify({ success: false, error: 'Access Denied' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const token = await generateJwt({
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: outletId || user.outlet_id
      }, JWT_SECRET);

      return new Response(JSON.stringify({
        success: true,
        token,
        user: { id: user.id, username: user.email, role: user.role, tenantId: user.tenant_id, outletId: outletId || user.outlet_id }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

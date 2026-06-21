import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const url = new URL(req.url);
    const outletId = url.searchParams.get('outletId');
    const action = url.searchParams.get('action') ?? 'get';

    if (!outletId) {
      return new Response(JSON.stringify({ error: 'outletId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Get Settings ─────────────────────────────────────────────────────────
    if (req.method === 'GET' || action === 'get') {
      const { data, error } = await supabase
        .from('outlet_settings')
        .select('settings_json, updated_at')
        .eq('outlet_id', outletId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const defaultSettings = {
        receipt: {
          logo: null,
          headerText: 'Welcome to Our Restaurant',
          footerText: 'Thank you for your visit!',
          fontSize: 'medium',
          qrCode: { enabled: false, url: '' },
          socialMedia: { facebook: '', instagram: '', twitter: '', tiktok: '' },
          promoMessages: []
        },
        customerDisplay: {
          backgroundColor: '#1a1a1a',
          textColor: '#ffffff',
          accentColor: '#f59e0b',
          restaurantName: 'Restaurant',
          tagline: '',
          promoImages: []
        }
      };

      const settings = data?.settings_json || defaultSettings;

      return new Response(JSON.stringify({
        success: true,
        settings,
        updatedAt: data?.updated_at || null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Update Settings ──────────────────────────────────────────────────────
    if (req.method === 'PUT' || action === 'update') {
      const body = await req.json();
      const { settings } = body;

      if (!settings) {
        return new Response(JSON.stringify({ error: 'settings object required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('outlet_settings')
        .upsert({
          outlet_id: outletId,
          settings_json: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'outlet_id'
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Settings updated',
        settings: data.settings_json
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Upload Logo ──────────────────────────────────────────────────────────
    if (action === 'upload-logo') {
      // Note: File upload requires multipart/form-data handling
      // For now, return a placeholder that frontend should handle via Supabase Storage directly
      return new Response(JSON.stringify({
        success: false,
        error: 'Please upload directly to Supabase Storage from frontend',
        info: 'Use supabase.storage.from(receipts).upload() in frontend'
      }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Settings API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

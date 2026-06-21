import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, PUT, OPTIONS',
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
    const action = url.searchParams.get('action');

    // ─── Get Favorites ────────────────────────────────────────────────────────
    if (req.method === 'GET' || action === 'get') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          user_id,
          product_id,
          position,
          created_at,
          products (
            id,
            name,
            price,
            image,
            category_id
          )
        `)
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;

      const favorites = (data ?? []).map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        productId: f.product_id,
        position: f.position,
        product: Array.isArray(f.products) ? f.products[0] : f.products,
        createdAt: f.created_at
      }));

      return new Response(JSON.stringify({ success: true, favorites }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Add Favorite ─────────────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'add') {
      const body = await req.json();
      const { userId, productId, position = 0 } = body;

      if (!userId || !productId) {
        return new Response(JSON.stringify({ error: 'userId and productId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check limit (max 50 per user)
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count >= 50) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Maximum 50 favorites per user',
          code: 'FAVORITES_LIMIT_EXCEEDED'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id: productId, position })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Product already in favorites',
            code: 'FAVORITE_ALREADY_EXISTS'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }

      return new Response(JSON.stringify({ success: true, favorite: data }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Remove Favorite ──────────────────────────────────────────────────────
    if (req.method === 'DELETE' || action === 'remove') {
      const favoriteId = url.searchParams.get('id') || url.searchParams.get('favoriteId');
      if (!favoriteId) {
        return new Response(JSON.stringify({ error: 'favoriteId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: 'Favorite removed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Reorder Favorites ────────────────────────────────────────────────────
    if (req.method === 'PUT' && action === 'reorder') {
      const body = await req.json();
      const { userId, favorites } = body;

      if (!userId || !favorites || !Array.isArray(favorites)) {
        return new Response(JSON.stringify({ error: 'userId and favorites array required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update positions in batch
      for (const fav of favorites) {
        await supabase
          .from('favorites')
          .update({ position: fav.position })
          .eq('id', fav.id)
          .eq('user_id', userId);
      }

      return new Response(JSON.stringify({ success: true, message: 'Favorites reordered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid method or action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Favorites API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

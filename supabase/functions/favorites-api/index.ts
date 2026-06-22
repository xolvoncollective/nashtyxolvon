// ==========================================
// FAVORITES API - Supabase Edge Function
// Date: 2026-06-22
// Purpose: CRUD operations for user favorites
// ==========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Favorite {
  id?: string
  user_id: string
  product_id: string
  position: number
  created_at?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname

    // ===== GET /favorites - Get user's favorites =====
    if (method === 'GET' && path === '/favorites-api') {
      const { data: favorites, error } = await supabaseClient
        .from('favorites')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            category_id,
            categories (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .limit(50) // Max 50 favorites

      if (error) {
        console.error('Error fetching favorites:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ favorites }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ===== POST /favorites - Add favorite =====
    if (method === 'POST' && path === '/favorites-api') {
      const body = await req.json()
      const { product_id } = body

      if (!product_id) {
        return new Response(
          JSON.stringify({ error: 'product_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if user already has 50 favorites (max limit)
      const { count } = await supabaseClient
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (count && count >= 50) {
        return new Response(
          JSON.stringify({ error: 'Maximum 50 favorites allowed' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if already favorited
      const { data: existing } = await supabaseClient
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Product already in favorites' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Get next position (max position + 1)
      const { data: maxPos } = await supabaseClient
        .from('favorites')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      const position = maxPos ? maxPos.position + 1 : 0

      // Insert favorite
      const { data: favorite, error } = await supabaseClient
        .from('favorites')
        .insert({
          user_id: user.id,
          product_id,
          position,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding favorite:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ favorite }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ===== DELETE /favorites/:id - Remove favorite =====
    if (method === 'DELETE' && path.startsWith('/favorites-api/')) {
      const favoriteId = path.split('/').pop()

      if (!favoriteId) {
        return new Response(
          JSON.stringify({ error: 'favorite_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { error } = await supabaseClient
        .from('favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id) // Ensure user owns this favorite

      if (error) {
        console.error('Error deleting favorite:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ===== PUT /favorites/reorder - Reorder favorites =====
    if (method === 'PUT' && path === '/favorites-api/reorder') {
      const body = await req.json()
      const { favorites } = body // Array of { id, position }

      if (!Array.isArray(favorites)) {
        return new Response(
          JSON.stringify({ error: 'favorites array is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update positions in batch
      const updates = favorites.map((fav) =>
        supabaseClient
          .from('favorites')
          .update({ position: fav.position })
          .eq('id', fav.id)
          .eq('user_id', user.id) // Ensure user owns this favorite
      )

      const results = await Promise.all(updates)

      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        console.error('Error reordering favorites:', errors)
        return new Response(
          JSON.stringify({ error: 'Failed to reorder some favorites' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

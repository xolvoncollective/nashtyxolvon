const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// POST /api/favorites - Add favorite
router.post('/', async (req, res) => {
  const { userId, productId, position } = req.body;
  
  // Check max 50 favorites
  const { count } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (count >= 50) {
    return res.status(400).json({ error: 'Maksimal 50 favorit' });
  }
  
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId, position })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/favorites - Get user favorites
router.get('/', async (req, res) => {
  const { userId } = req.query;
  
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(*)')
    .eq('user_id', userId)
    .order('position');
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ favorites: data || [] });
});

// DELETE /api/favorites/:productId - Remove favorite
router.delete('/:productId', async (req, res) => {
  const { productId } = req.params;
  const userId = req.headers['x-user-id']; // From auth middleware
  
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// PUT /api/favorites/reorder - Reorder favorites
router.put('/reorder', async (req, res) => {
  const { productIds } = req.body;
  const userId = req.headers['x-user-id'];
  
  try {
    for (let i = 0; i < productIds.length; i++) {
      await supabase
        .from('favorites')
        .update({ position: i })
        .eq('user_id', userId)
        .eq('product_id', productIds[i]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

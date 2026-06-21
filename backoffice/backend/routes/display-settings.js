const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/outlets/:id/display-settings
router.get('/:id/display-settings', async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('outlets')
    .select('display_background_color, display_text_color, display_accent_color, display_promo_images')
    .eq('id', id)
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || {});
});

// PUT /api/outlets/:id/display-settings
router.put('/:id/display-settings', async (req, res) => {
  const { id } = req.params;
  const settings = req.body;
  
  const { data, error } = await supabase
    .from('outlets')
    .update(settings)
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;

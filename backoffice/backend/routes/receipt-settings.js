const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/outlets/:id/receipt-settings
router.get('/:id/receipt-settings', async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase
    .from('outlets')
    .select('receipt_logo, receipt_header, receipt_footer, receipt_font_size, receipt_qr_feedback, receipt_social_facebook, receipt_social_instagram, receipt_social_twitter, receipt_social_tiktok, receipt_promos')
    .eq('id', id)
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || {});
});

// PUT /api/outlets/:id/receipt-settings
router.put('/:id/receipt-settings', async (req, res) => {
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

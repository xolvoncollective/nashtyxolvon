const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/analytics/top-products
router.get('/top-products', async (req, res) => {
  const { outletId, days = 7, limit = 20 } = req.query;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const { data, error } = await supabase.rpc('get_top_products', {
    outlet_id: outletId,
    since: cutoff.toISOString(),
    limit_count: parseInt(limit)
  });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data || [] });
});

module.exports = router;

/**
 * NASHTY OS - Favorites API
 * Handles user favorites for quick product access in POS
 */

const Database = require('better-sqlite3');
const { nanoid } = require('nanoid');

/**
 * Get user's favorites
 * GET /api/favorites?userId=xxx
 */
exports.getFavorites = (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const db = new Database('./database.db');
    
    const favorites = db.prepare(`
      SELECT 
        f.id,
        f.user_id,
        f.product_id,
        f.position,
        f.created_at,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image,
        p.status as product_status,
        c.name as category_name
      FROM favorites f
      INNER JOIN products p ON f.product_id = p.id
      INNER JOIN categories c ON p.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.position ASC, f.created_at ASC
    `).all(userId);
    
    db.close();
    
    res.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

/**
 * Add product to favorites
 * POST /api/favorites
 * Body: { userId, productId }
 */
exports.addFavorite = (req, res) => {
  const { userId, productId } = req.body;
  
  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId required' });
  }

  try {
    const db = new Database('./database.db');
    
    // Check if already favorited
    const existing = db.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).get(userId, productId);
    
    if (existing) {
      db.close();
      return res.status(409).json({ error: 'Product already in favorites' });
    }
    
    // Check favorites count (max 50)
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM favorites WHERE user_id = ?
    `).get(userId);
    
    if (count.count >= 50) {
      db.close();
      return res.status(400).json({ error: 'Maximum 50 favorites allowed' });
    }
    
    // Get next position
    const lastPosition = db.prepare(`
      SELECT MAX(position) as max_pos FROM favorites WHERE user_id = ?
    `).get(userId);
    
    const position = (lastPosition.max_pos || 0) + 1;
    
    // Insert favorite
    const id = nanoid();
    db.prepare(`
      INSERT INTO favorites (id, user_id, product_id, position)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, productId, position);
    
    // Get created favorite with product details
    const favorite = db.prepare(`
      SELECT 
        f.id,
        f.user_id,
        f.product_id,
        f.position,
        f.created_at,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image
      FROM favorites f
      INNER JOIN products p ON f.product_id = p.id
      WHERE f.id = ?
    `).get(id);
    
    db.close();
    
    res.status(201).json({ favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

/**
 * Remove favorite
 * DELETE /api/favorites/:id
 */
exports.removeFavorite = (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  
  if (!id || !userId) {
    return res.status(400).json({ error: 'id and userId required' });
  }

  try {
    const db = new Database('./database.db');
    
    // Verify ownership
    const favorite = db.prepare(`
      SELECT id FROM favorites WHERE id = ? AND user_id = ?
    `).get(id, userId);
    
    if (!favorite) {
      db.close();
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    // Delete
    db.prepare(`DELETE FROM favorites WHERE id = ?`).run(id);
    
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

/**
 * Reorder favorites
 * PUT /api/favorites/reorder
 * Body: { userId, favorites: [{ id, position }, ...] }
 */
exports.reorderFavorites = (req, res) => {
  const { userId, favorites } = req.body;
  
  if (!userId || !Array.isArray(favorites)) {
    return res.status(400).json({ error: 'userId and favorites array required' });
  }

  try {
    const db = new Database('./database.db');
    
    // Start transaction
    const updatePosition = db.prepare(`
      UPDATE favorites 
      SET position = ? 
      WHERE id = ? AND user_id = ?
    `);
    
    const transaction = db.transaction((items) => {
      for (const item of items) {
        updatePosition.run(item.position, item.id, userId);
      }
    });
    
    transaction(favorites);
    
    db.close();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder favorites error:', error);
    res.status(500).json({ error: 'Failed to reorder favorites' });
  }
};

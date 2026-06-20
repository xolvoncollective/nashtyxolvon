import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { z } from 'zod';

const router = Router();

const addFavoriteSchema = z.object({
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  position: z.number().int().min(0).default(0)
});

const reorderSchema = z.object({
  userId: z.string().uuid(),
  favorites: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0)
  }))
});

// Add favorite
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { userId, productId, position } = addFavoriteSchema.parse(req.body);

    // Verify user owns the userId they are adding for (or is service_role)
    if (req.user!.id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to add favorites for this user' });
    }

    // Check limit
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count >= 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 favorites per user',
        code: 'FAVORITES_LIMIT_EXCEEDED'
      });
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, product_id: productId, position })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Product already in favorites', code: 'FAVORITE_ALREADY_EXISTS' });
      }
      throw error;
    }

    logger.info('Favorite added', { userId, productId });
    res.status(201).json({ success: true, favorite: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('Add favorite error', { error });
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

// Get favorites
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Must be own favorites
    if (req.user!.id !== userId) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
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

    const favorites = data?.map(f => ({
      id: f.id,
      userId: f.user_id,
      productId: f.product_id,
      position: f.position,
      product: Array.isArray(f.products) ? f.products[0] : f.products,
      createdAt: f.created_at
    })) || [];

    res.json({ success: true, favorites });
  } catch (error) {
    logger.error('Get favorites error', { error });
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
});

// Remove favorite
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    logger.info('Favorite removed', { favoriteId: id, userId: req.user!.id });
    res.json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    logger.error('Remove favorite error', { error });
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

// Reorder favorites
router.put('/reorder', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { userId, favorites } = reorderSchema.parse(req.body);

    if (req.user!.id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updates = favorites.map(f => 
      supabase
        .from('favorites')
        .update({ position: f.position })
        .eq('id', f.id)
        .eq('user_id', userId)
    );

    await Promise.all(updates);

    logger.info('Favorites reordered', { userId });
    res.json({ success: true, message: 'Favorites reordered' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('Reorder favorites error', { error });
    res.status(500).json({ success: false, error: 'Failed to reorder favorites' });
  }
});

export default router;

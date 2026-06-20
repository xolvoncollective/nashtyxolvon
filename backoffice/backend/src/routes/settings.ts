import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { logger } from '../middleware/logger';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { config } from '../config';

const router = Router();

// ─── Multer Configuration (fixed: memoryStorage not memoryBuffer) ──────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${config.upload.allowedImageTypes.join(', ')}`));
    }
  }
});

// ─── Validation Schema ────────────────────────────────────────────────────────
const settingsSchema = z.object({
  receipt: z.object({
    logo: z.string().url().optional().nullable(),
    headerText: z.string().max(200).optional(),
    footerText: z.string().max(300).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    qrCode: z.object({
      enabled: z.boolean(),
      url: z.string().optional().nullable()
    }).optional(),
    socialMedia: z.object({
      facebook: z.string().optional().nullable(),
      instagram: z.string().optional().nullable(),
      twitter: z.string().optional().nullable(),
      tiktok: z.string().optional().nullable()
    }).optional(),
    promoMessages: z.array(z.string().max(150)).max(3).optional()
  }).optional(),
  customerDisplay: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    accentColor: z.string().optional(),
    restaurantName: z.string().max(100).optional(),
    tagline: z.string().max(200).optional(),
    promoImages: z.array(z.string().url()).max(10).optional()
  }).optional()
});

// ─── Get Outlet Settings ──────────────────────────────────────────────────────
router.get('/:outletId/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId } = req.params;

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

    res.json({ success: true, settings, updatedAt: data?.updated_at || null });
  } catch (error) {
    logger.error('Get settings error', { error, outletId: req.params.outletId });
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// ─── Update Outlet Settings ───────────────────────────────────────────────────
router.put('/:outletId/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId } = req.params;
    const settings = settingsSchema.parse(req.body);

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

    // Log activity (non-blocking)
    supabase.from('activity_logs').insert({
      tenant_id: req.user!.tenantId,
      user_id: req.user!.id,
      action_type: 'settings_updated',
      entity_type: 'outlet_settings',
      entity_id: outletId,
      metadata: { settingsKeys: Object.keys(settings) }
    }).then(() => {});

    logger.info('Settings updated', { outletId, userId: req.user!.id });

    res.json({ success: true, message: 'Settings updated', settings: data.settings_json });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('Update settings error', { error });
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// ─── Upload Logo ──────────────────────────────────────────────────────────────
router.post('/:outletId/upload-logo', authenticateJWT, uploadLimiter, upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    const { outletId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File size exceeds 2MB limit' });
    }

    // Validate MIME type explicitly
    const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedLogoTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only JPEG, PNG, SVG, and WebP are allowed for logos' });
    }

    let buffer = file.buffer;
    let contentType = file.mimetype;
    let extension = file.mimetype.split('/')[1];

    // Resize image (skip SVG)
    if (file.mimetype !== 'image/svg+xml') {
      buffer = await sharp(file.buffer)
        .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      contentType = 'image/jpeg';
      extension = 'jpg';
    }

    const fileName = `logos/${outletId}/logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    // Auto-update settings with new logo URL
    await supabase
      .from('outlet_settings')
      .upsert({
        outlet_id: outletId,
        settings_json: { receipt: { logo: urlData.publicUrl } },
        updated_at: new Date().toISOString()
      }, { onConflict: 'outlet_id' })
      .then(() => {});

    logger.info('Logo uploaded', { outletId, fileName });

    res.json({ success: true, url: urlData.publicUrl, fileName });
  } catch (error) {
    logger.error('Upload logo error', { error });
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

// ─── Upload Promo Images ──────────────────────────────────────────────────────
router.post('/:outletId/upload-promo-images', authenticateJWT, uploadLimiter, upload.array('images', 10), async (req: AuthRequest, res) => {
  try {
    const { outletId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    // Validate file sizes (5MB each)
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      return res.status(400).json({
        success: false,
        error: `${oversized.length} file(s) exceed 5MB limit`,
        files: oversized.map(f => f.originalname)
      });
    }

    const timestamp = Date.now();
    const uploadPromises = files.map(async (file, index) => {
      const buffer = await sharp(file.buffer)
        .resize({ width: 1920, height: 1080, fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const fileName = `promos/${outletId}/promo-${timestamp}-${index}.jpg`;
      const { error } = await supabase.storage
        .from('promotions')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('promotions')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    });

    const urls = await Promise.all(uploadPromises);

    logger.info('Promo images uploaded', { outletId, count: urls.length });

    res.json({ success: true, urls, count: urls.length });
  } catch (error) {
    logger.error('Upload promo images error', { error });
    res.status(500).json({ success: false, error: 'Failed to upload images' });
  }
});

export default router;

import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { logger } from '../middleware/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import crypto from 'crypto';

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// ─── Login (Fallback for Edge Function) ───────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { action, username, password, pin, outletId } = req.body;

    // ─── Main Login (manager/superadmin) ───
    if (action === 'main-login' || action === 'superadmin-login') {
      const loginEmail = username === 'admin1' ? 'admin@nashty' : username;
      const allowedRoles = action === 'superadmin-login'
        ? ['superadmin', 'owner', 'manager', 'admin']
        : ['manager', 'superadmin', 'owner', 'admin'];

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, tenant_id, outlet_id, status, password')
        .eq('email', loginEmail)
        .in('role', allowedRoles)
        .single();

      if (error || !user || user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, error: 'Account is inactive' });
      }

      const effectiveOutletId = outletId || user.outlet_id;

      const token = jwt.sign({
        sub: user.id, name: user.name, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId
      }, config.jwt.secret, { expiresIn: '1h' });

      const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, config.jwt.refreshSecret, { expiresIn: '30d' });

      await supabase.from('activity_logs').insert({
        tenant_id: user.tenant_id, user_id: user.id, action_type: 'user_login', entity_type: 'auth',
        metadata: { action, ip: req.ip || 'unknown' }
      });

      return res.json({
        success: true, token, refreshToken, expiresIn: '1h',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId }
      });
    }

    // ─── PIN Login (cashier/staff) ───
    if (action === 'pin-login') {
      if (!pin) return res.status(400).json({ success: false, error: 'PIN is required' });

      let q = supabase.from('users').select('id, name, role, tenant_id, outlet_id, status, pin').eq('pin', pin);
      if (outletId) q = q.eq('outlet_id', outletId);
      const { data: user, error } = await q.single();

      if (error || !user) return res.status(401).json({ success: false, error: 'Invalid PIN' });
      if (user.status === 'inactive') return res.status(403).json({ success: false, error: 'User account is inactive' });

      const effectiveOutletId = outletId || user.outlet_id;

      const token = jwt.sign({
        sub: user.id, name: user.name, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId
      }, config.jwt.secret, { expiresIn: '12h' });

      const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, config.jwt.refreshSecret, { expiresIn: '30d' });

      await supabase.from('activity_logs').insert({
        tenant_id: user.tenant_id, user_id: user.id, action_type: 'pin_login', entity_type: 'auth',
        metadata: { outletId: effectiveOutletId }
      });

      return res.json({
        success: true, token, refreshToken, expiresIn: '12h',
        user: { id: user.id, name: user.name, role: user.role, tenantId: user.tenant_id, outletId: effectiveOutletId }
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    logger.error('Login error', { error: err });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Token Refresh ────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'Refresh token is required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

    // Hash the token to check blacklist (store hash, not raw token for security)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if token is blacklisted
    const { data: blacklisted } = await supabase
      .from('token_blacklist')
      .select('id')
      .eq('token_hash', tokenHash)
      .single();

    if (blacklisted) {
      return res.status(401).json({ success: false, error: 'Refresh token has been revoked' });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, role, tenant_id, outlet_id, status')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ success: false, error: 'User account is inactive' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: user.outlet_id
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    // Generate new refresh token (rotation)
    const newRefreshToken = jwt.sign(
      { sub: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn as any }
    );

    // Blacklist old refresh token (store hash)
    await supabase.from('token_blacklist').insert({
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: new Date(decoded.exp * 1000).toISOString()
    });

    // Log token refresh
    await supabase.from('activity_logs').insert({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action_type: 'token_refreshed',
      entity_type: 'auth',
      metadata: { timestamp: new Date().toISOString() }
    });

    // Get outlet info
    const { data: outlet } = await supabase
      .from('outlets')
      .select('id, name')
      .eq('id', user.outlet_id)
      .single();

    logger.info('Token refreshed', { userId: user.id, role: user.role });

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: config.jwt.expiresIn,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: user.outlet_id
      },
      outlet: outlet || { id: user.outlet_id, name: 'Unknown Outlet' }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Refresh token has expired' });
    }
    logger.error('Token refresh error', { error });
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// ─── Logout (Blacklist current token) ────────────────────────────────────────
router.post('/logout', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const decoded = jwt.decode(token) as any;

      await supabase.from('token_blacklist').insert({
        token_hash: tokenHash,
        user_id: req.user!.id,
        expires_at: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 86400000).toISOString()
      }).then(() => {});
    }

    logger.info('User logged out', { userId: req.user?.id });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// ─── Validate Token ───────────────────────────────────────────────────────────
router.get('/validate', authenticateJWT, (req: AuthRequest, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

export default router;

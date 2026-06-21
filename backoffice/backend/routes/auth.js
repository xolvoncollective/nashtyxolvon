/**
 * NASHTY OS - AUTH API
 * Unified authentication service untuk semua sistem
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'ZaidunkMargin';
const JWT_EXPIRES_IN = '12h';

// Helper: Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Helper: Verify password
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Helper: Generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper: Get user system access
async function getUserSystemAccess(userId) {
  const { data, error } = await supabase
    .from('user_system_access')
    .select('system_name')
    .eq('user_id', userId)
    .eq('has_access', true);

  if (error) return [];
  return data.map(row => row.system_name);
}

/**
 * POST /api/auth/login
 * Login dengan username/password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password required' 
      });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Get user's allowed systems
    const allowedSystems = await getUserSystemAccess(user.id);

    // Generate JWT
    const token = generateToken(user);

    // Create session record
    const tokenHash = await bcrypt.hash(token, 6); // Light hash for lookup
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      token_hash: tokenHash,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    });

    // Update last login
    await supabase
      .from('system_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Get default outlet (first outlet user has access to)
    const { data: outlets } = await supabase
      .from('user_outlet_access')
      .select('outlet_id, outlets(*)')
      .eq('user_id', user.id)
      .limit(1);

    const outlet = outlets && outlets[0] ? outlets[0].outlets : null;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email
      },
      outlet,
      allowedSystems
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/auth/validate
 * Validate current session
 */
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user still active
      const { data: user } = await supabase
        .from('system_users')
        .select('is_active')
        .eq('id', decoded.id)
        .single();

      if (!user || !user.is_active) {
        return res.status(401).json({ valid: false });
      }

      res.json({ valid: true });
    } catch (jwtError) {
      res.status(401).json({ valid: false });
    }
  } catch (err) {
    console.error('[Auth] Validate error:', err);
    res.status(500).json({ valid: false });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Old and new password required' 
      });
    }

    // Get user
    const { data: user } = await supabase
      .from('system_users')
      .select('password_hash')
      .eq('id', decoded.id)
      .single();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Verify old password
    const valid = await verifyPassword(oldPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password incorrect' 
      });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update
    await supabase
      .from('system_users')
      .update({ 
        password_hash: newHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenHash = await bcrypt.hash(token, 6);
      
      // Delete session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('token_hash', tokenHash);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    res.json({ success: true }); // Return success anyway
  }
});

module.exports = router;

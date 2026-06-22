/**
 * USER MANAGEMENT API
 * CRUD operations untuk manage users (superadmin only)
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

// Middleware: Verify superadmin
async function verifySuperadmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if superadmin
    const { data: user } = await supabase
      .from('system_users')
      .select('role')
      .eq('id', decoded.id)
      .single();

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

/**
 * GET /api/users
 * List all users with their system access
 */
router.get('/', verifySuperadmin, async (req, res) => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Get system access for each user
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const { data: access } = await supabase
          .from('user_system_access')
          .select('system_name')
          .eq('user_id', user.id)
          .eq('has_access', true);

        return {
          ...user,
          systems: access ? access.map(a => a.system_name) : [],
          password_hash: undefined // Don't send hash to frontend
        };
      })
    );

    res.json({ success: true, users: usersWithAccess });
  } catch (err) {
    console.error('[Users] List error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', verifySuperadmin, async (req, res) => {
  try {
    const { username, password, full_name, email, role, systems } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, password, and role required' 
      });
    }

    // Check if username exists
    const { data: existing } = await supabase
      .from('system_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('system_users')
      .insert({
        username,
        password_hash,
        full_name,
        email,
        role,
        is_active: true,
        created_by: req.userId
      })
      .select()
      .single();

    if (createError) throw createError;

    // Set system access
    if (systems && systems.length > 0) {
      const accessRecords = systems.map(system_name => ({
        user_id: newUser.id,
        system_name,
        has_access: true
      }));

      await supabase.from('user_system_access').insert(accessRecords);
    }

    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('[Users] Create error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', verifySuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name, email, role, systems } = req.body;

    // Build update object
    const updates = {
      username,
      full_name,
      email,
      role,
      updated_at: new Date().toISOString()
    };

    // Update password if provided
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('system_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update system access
    if (systems) {
      // Delete existing access
      await supabase
        .from('user_system_access')
        .delete()
        .eq('user_id', id);

      // Insert new access
      if (systems.length > 0) {
        const accessRecords = systems.map(system_name => ({
          user_id: id,
          system_name,
          has_access: true
        }));

        await supabase.from('user_system_access').insert(accessRecords);
      }
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[Users] Update error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/users/:id/toggle
 * Toggle user active status
 */
router.post('/:id/toggle', verifySuperadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Don't allow disabling superadmin role
    const { data: user } = await supabase
      .from('system_users')
      .select('username, role')
      .eq('id', id)
      .single();

    if (user && user.role === 'superadmin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot disable superadmin account' 
      });
    }

    await supabase
      .from('system_users')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Users] Toggle error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

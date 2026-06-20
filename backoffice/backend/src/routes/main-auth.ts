import { Router } from 'express';
import { 
  validateAdminCredentials, 
  createAdminSessionToken, 
  validateAdminSessionToken 
} from '../supabase/supabase-client';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'NASHTY OS Main Auth API'
  });
});

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username dan password diperlukan' 
      });
    }

    // Validate credentials
    const adminSession = await validateAdminCredentials(username, password);
    
    if (!adminSession) {
      return res.status(401).json({ 
        error: 'Username atau password salah' 
      });
    }

    // Create session token
    const token = await createAdminSessionToken(adminSession);

    // Session data
    const sessionData = {
      id: adminSession.id,
      username: adminSession.username,
      role: adminSession.role,
      tenantId: adminSession.tenantId,
      createdAt: adminSession.createdAt.toISOString(),
      expiresIn: 12 * 60 * 60 // 12 hours in seconds
    };

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      session: sessionData,
      user: {
        id: adminSession.id,
        username: adminSession.username,
        role: adminSession.role,
        tenantId: adminSession.tenantId
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat login' 
    });
  }
});

// Session validation endpoint
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token diperlukan' 
      });
    }

    const adminSession = await validateAdminSessionToken(token);
    
    if (!adminSession) {
      return res.status(401).json({ 
        error: 'Sesi tidak valid atau telah berakhir' 
      });
    }

    res.json({
      valid: true,
      session: {
        id: adminSession.id,
        username: adminSession.username,
        role: adminSession.role,
        tenantId: adminSession.tenantId,
        createdAt: adminSession.createdAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Session validation error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat validasi sesi' 
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // We just return success
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

// Get available apps endpoint
router.get('/apps', async (req, res) => {
  const apps = [
    {
      id: 'pos',
      name: 'POS Terminal',
      description: 'Point of Sale untuk kasir',
      icon: '🛒',
      path: '/pos/frontend/index.html',
      permissions: ['admin', 'cashier'],
      features: ['order-processing', 'payment', 'menu-management']
    },
    {
      id: 'kds',
      name: 'Kitchen Display',
      description: 'KDS untuk dapur',
      icon: '👨‍🍳',
      path: '/kds/frontend/index.html',
      permissions: ['admin', 'kitchen'],
      features: ['order-display', 'status-updates', 'kitchen-workflow']
    },
    {
      id: 'backoffice',
      name: 'Backoffice Dashboard',
      description: 'Management dashboard',
      icon: '📊',
      path: '/backoffice/frontend/index.html',
      permissions: ['admin'],
      features: ['analytics', 'reporting', 'staff-management']
    }
  ];

  res.json({
    apps,
    timestamp: new Date().toISOString()
  });
});

// Admin session middleware (for protected routes)
export const requireAdminSession = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Sesi admin diperlukan' 
      });
    }

    const token = authHeader.split(' ')[1];
    const adminSession = await validateAdminSessionToken(token);
    
    if (!adminSession) {
      return res.status(401).json({ 
        error: 'Sesi admin tidak valid' 
      });
    }

    // Attach admin session to request
    req.admin = adminSession;
    next();

  } catch (error) {
    console.error('Admin session middleware error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat validasi sesi admin' 
    });
  }
};

// Protected route example
router.get('/admin/info', requireAdminSession, async (req: any, res) => {
  res.json({
    success: true,
    admin: req.admin,
    timestamp: new Date().toISOString()
  });
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string;
    outletId: string | null;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk aksi ini.' });
    }
    next();
  };
};

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      tenantId: user.tenant_id,
      outletId: user.outlet_id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ─── Auth Rate Limiter (10 req/min) ──────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 1 minute.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 1 minute.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(((req as any).rateLimit?.resetTime?.getTime() ?? Date.now() + 60000) / 1000)
    });
  }
});

// ─── Upload Rate Limiter (5 req/min) ─────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many upload requests. Please try again in 1 minute.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many upload requests. Please try again in 1 minute.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    });
  }
});

// ─── General API Limiter (200 req/min) ───────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED'
  }
});

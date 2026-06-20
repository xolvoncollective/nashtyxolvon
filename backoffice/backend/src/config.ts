import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  },
  
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png']
  },
  
  analytics: {
    cacheTTL: parseInt(process.env.ANALYTICS_CACHE_TTL || '21600', 10),
    minTransactions: parseInt(process.env.MIN_TRANSACTIONS_FOR_OUTLET_ANALYTICS || '100', 10)
  }
};

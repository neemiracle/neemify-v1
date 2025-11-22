/**
 * @file Application configuration
 * @module config
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  license: {
    encryptionKey: process.env.LICENSE_ENCRYPTION_KEY || 'default-key-change-in-production',
    signingKey: process.env.LICENSE_SIGNING_KEY || 'default-signing-key',
  },
  superUser: {
    email: process.env.SUPER_USER_EMAIL || 'admin@neemify.com',
    password: process.env.SUPER_USER_PASSWORD || 'ChangeMe123!',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

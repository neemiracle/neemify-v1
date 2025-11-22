/**
 * @file Database configuration and Supabase client setup
 * @module config/database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

/**
 * Supabase client for general use (respects RLS)
 */
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Supabase admin client (bypasses RLS, use with caution)
 * Only for administrative operations like initial setup
 */
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Database configuration
 */
export const dbConfig = {
  url: process.env.SUPABASE_URL,
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000,
};

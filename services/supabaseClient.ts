import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: any = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing. Check your .env file or Vercel Environment Variables. Features relying on the database will be disabled.');
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
  }
}

export const supabase = supabaseInstance;
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY) are missing in process.env');
    }
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    console.log('✅ Supabase client initialized successfully');
  }
  return supabaseClient;
};
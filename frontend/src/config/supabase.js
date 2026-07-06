import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User roles enum
export const UserRoles = {
  COMPANY_USER: 'company_user',
  COMPANY_ADMIN: 'company_admin',
  GOVERNMENT: 'government_official',
  SUPER_ADMIN: 'super_admin'
};

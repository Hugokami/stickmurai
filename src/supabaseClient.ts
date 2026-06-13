import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkaylwyefvbaeheakpze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYXlsd3llZnZiYWVoZWFrcHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTUwNTMsImV4cCI6MjA5Njc3MTA1M30.kDlXIOzsxHSlVVxP2NmuKkka4nbvSkGyvS_wIIubzYc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

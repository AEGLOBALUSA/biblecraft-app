import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://frhhznokmrfvbddgmcbr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaGh6bm9rbXJmdmJkZGdtY2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDEyODUsImV4cCI6MjA4OTQxNzI4NX0.FYHCSH0fPqMlliY3EHd7kk1EuV5S8C8sydDGyKNrZ7o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check connection
export async function checkConnection() {
  const { error } = await supabase.from('campuses').select('count');
  if (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
  return true;
}

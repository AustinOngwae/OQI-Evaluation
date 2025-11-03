import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwkrqhnshfusxbikjtyy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3a3JxaG5zaGZ1c3hiaWtqdHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzIwOTUsImV4cCI6MjA3Nzc0ODA5NX0.arr8wAhXrUwziZakBliScWh_LgEnTauTA0qrJqP6IMs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
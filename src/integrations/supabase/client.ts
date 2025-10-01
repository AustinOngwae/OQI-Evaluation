import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdmbbbbbqmvbdiuproqr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkbWJiYmJicW12YmRpdXByb3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTgzOTgsImV4cCI6MjA3NDg3NDM5OH0.cU953tgY-7BhdDLZeqn1F4Bmrp5MIXI1nxg-aEruEik';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = 'https://hsnwvtznlyafvqoiuovi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzbnd2dHpubHlhZnZxb2l1b3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODY5NzIsImV4cCI6MjA4Mjg2Mjk3Mn0.fHyUyYJoFl1lKRrHoCcYvDbECjPeJZSWGZJctlC4tMA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pspzeuljzoqhysulwenx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHpldWxqem9xaHlzdWx3ZW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzQ0NDAsImV4cCI6MjA1NDYxMDQ0MH0.OuGJEVQYbtlCPjZ37UJ-QzUi1qTSxYsB7ysEDscnb2w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

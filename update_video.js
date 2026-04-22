import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching testimonials...");
  const { data: fetch, error: fetchErr } = await supabase.from('testimonials').select('*');
  console.log("Current testimonials:", fetch);

  console.log("Updating video URL...");
  const { data, error } = await supabase
    .from('testimonials')
    .update({ video_url: '/videos/WhatsApp Video 2026-03-10 at 3.32.29 PM.mp4' })
    .eq('is_featured', true)
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Update success!");
  }
}

run();

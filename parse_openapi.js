import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  const tables = ['automation_rules', 'automation_events', 'automation_runs', 'automation_event_catalog'];
  
  for (const t of tables) {
    if (data.definitions && data.definitions[t]) {
      console.log(`\n--- ${t} ---`);
      console.log(Object.keys(data.definitions[t].properties).join(', '));
    }
  }
}
run();

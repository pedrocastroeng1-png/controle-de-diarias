import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function introspect() {
  const query = `
    query {
      __schema {
        types {
          name
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  `;
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/graphql/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  const tables = ['automation_rules', 'automation_events', 'automation_runs', 'automation_event_catalog'];
  
  if (data.data && data.data.__schema) {
    for (const t of tables) {
      // In pg_graphql, tables are usually exposed with Capitalized names or similar
      const type = data.data.__schema.types.find(type => type.name.toLowerCase() === t.toLowerCase() || type.name.toLowerCase() === t.toLowerCase().replace(/_/g, ''));
      if (type) {
        console.log(`\n--- ${t} ---`);
        console.log(type.fields.map(f => f.name).join(', '));
      } else {
        console.log(`Type ${t} not found in GraphQL schema.`);
      }
    }
  } else {
    console.log(data);
  }
}
introspect();

const axios = require('axios');
require('dotenv').config();
async function test() {
  try {
    const res = await axios.get(process.env.VITE_SUPABASE_URL + '/rest/v1/presencas', {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY },
      params: { limit: 1 }
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();

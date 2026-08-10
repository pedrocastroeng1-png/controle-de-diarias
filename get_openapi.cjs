const axios = require('axios');
require('dotenv').config();
async function test() {
  try {
    const res = await axios.get(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY }
    });
    const paths = Object.keys(res.data.paths).filter(p => p.startsWith('/rpc/'));
    console.log(paths);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (user.app_metadata?.platform_role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden: Not an owner' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Reject unallowed payload keys
    const allowedKeys = ['ativo'];
    const bodyKeys = Object.keys(req.body);
    const hasUnallowedKeys = bodyKeys.some(key => !allowedKeys.includes(key));

    if (hasUnallowedKeys) {
       return res.status(400).json({ error: 'Invalid payload. Only "ativo" is allowed.' });
    }

    if (typeof req.body.ativo !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid "ativo" field' });
    }

    const { ativo } = req.body;

    const { error } = await supabase.from('usuarios').update({ ativo }).eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

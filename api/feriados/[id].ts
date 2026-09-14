import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!supabaseUrl || !serviceRoleKey || !jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (payload.perfil !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const empresaId = payload.empresa_id;
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing holiday ID' });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Make sure the holiday belongs to the user's company
    const { error } = await supabase
      .from('feriados')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

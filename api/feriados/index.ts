import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
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
    
    if (req.method !== 'GET' && payload.perfil !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const empresaId = payload.empresa_id;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('feriados')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data', { ascending: true });
        
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data);
    } 
    else if (req.method === 'POST') {
      const { data: date, descricao } = req.body;
      
      if (!date || !descricao) {
        return res.status(400).json({ error: 'Missing date or description' });
      }
      
      const { data, error } = await supabase
        .from('feriados')
        .insert({
          empresa_id: empresaId,
          data: date,
          descricao: descricao.trim().substring(0, 500)
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') { // unique violation
          return res.status(400).json({ error: 'Feriado já cadastrado para esta data.' });
        }
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json(data);
    } 
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Always use Service Role for administrative endpoints. No anon key fallback.
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Auth check must use a client created with the token OR the service role client's auth.getUser(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (user.app_metadata?.platform_role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden: Not an owner' });
    }

    const { nome, usuario, email, empresa_id, perfil, senha } = req.body;
    
    if (!nome || !usuario || !empresa_id || !perfil || !senha) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedSenha = bcrypt.hashSync(senha, 10);

    const { data, error } = await supabase.from('usuarios').insert({
      nome,
      usuario,
      login: usuario,
      email: email || null,
      senha: hashedSenha,
      perfil,
      empresa_id,
      ativo: true,
      tipo_usuario: perfil === 'ADMIN' ? 'GESTOR' : 'OPERADOR'
    }).select('id, nome, usuario, email, perfil, empresa_id, ativo, created_at, tipo_usuario').single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

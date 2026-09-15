import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!supabaseUrl || !serviceRoleKey || !jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const { usuario, senha } = req.body;
    
    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, perfil, senha, empresa_id, login, email, ativo')
      .or(`usuario.eq."${usuario}",login.eq."${usuario}",email.eq."${usuario}"`)
      .eq('ativo', true)
      .single();
      
    if (error || !data) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }
    
    if (data.perfil !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas administradores podem acessar.' });
    }
    
    const passwordHash = data.senha;
    let isValid = false;
    
    if (passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$'))) {
      isValid = await bcrypt.compare(senha, passwordHash);
    } else if (passwordHash) {
      isValid = senha === passwordHash;
    }
    
    if (!isValid) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: data.id, empresa_id: data.empresa_id, perfil: data.perfil },
      jwtSecret,
      { expiresIn: '8h' }
    );
    
    return res.status(200).json({ token });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

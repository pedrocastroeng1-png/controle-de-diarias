import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../lib/types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { setupPushNotifications } from '../lib/push';
import { Preferences } from '@capacitor/preferences';



interface AuthContextType {
  usuario: Usuario | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let storedUserStr = null;
      try {
        const { value } = await Preferences.get({ key: '@diarias:usuario' });
        storedUserStr = value;
      } catch(e) {
      }
      
      if (!storedUserStr) {
        storedUserStr = localStorage.getItem('@diarias:usuario');
      }

      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          const res = await api.checkUserActive(parsed.id);
          
          if (res.data && res.data.ativo) {
            setUsuario(res.data);
            setupPushNotifications(res.data.id);
          } else if (res.data && !res.data.ativo) {
            // Disabled by admin
            setUsuario(null);
            localStorage.removeItem('@diarias:usuario');
            await Preferences.remove({ key: '@diarias:usuario' });
          } else if (res.error && res.error.code === 'PGRST116') {
            // User deleted
            setUsuario(null);
            localStorage.removeItem('@diarias:usuario');
            await Preferences.remove({ key: '@diarias:usuario' });
          } else {
             // Keep offline or other network error
             setUsuario(parsed);
             setupPushNotifications(parsed.id);
          }
        } catch (e) {
           // Invalid JSON or other error, clear it just in case, but keep it simple
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (user: string, pass: string) => {
    setLoading(true);
    try {
      const u = await api.login(user, pass);
      if (u) {
        setUsuario(u);
        setupPushNotifications(u.id);
        localStorage.setItem('@diarias:usuario', JSON.stringify(u));
        try { await Preferences.set({ key: '@diarias:usuario', value: JSON.stringify(u) }); } catch(e) {}
        return true;
      }
      return false;
    } catch (e) {
      /* suppress login console error */
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // 1. Limpar estado local imediatamente (sem await) para feedback visual instantâneo
    setUsuario(null);
    localStorage.removeItem('@diarias:usuario');
    try { Preferences.remove({ key: '@diarias:usuario' }); } catch(e) {}
    localStorage.removeItem('supabase.auth.token');
    
    // 2. Redirecionar imediatamente para a tela de login
    window.location.href = '/login';
    
    // 3. Fazer o signOut no backend em background (fire-and-forget), sem bloquear a UI
    if (supabase) {
      supabase.auth.signOut().catch(e => console.error('Erro no Supabase signOut:', e));
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

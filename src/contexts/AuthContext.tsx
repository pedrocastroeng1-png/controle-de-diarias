import React, { createContext, useContext, useState, useEffect } from "react";
import { Usuario } from "../lib/types";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { setupPushNotifications } from "../lib/push";
import { onMessageListener } from "../lib/firebase";
import { Preferences } from "@capacitor/preferences";

interface AuthContextType {
  isOwner: boolean;
  usuario: any | null;
  empresa: any | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  accessCompany?: (empresaId: string) => Promise<void>;
  exitCompany?: () => void;
  ownerContext?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [empresa, setEmpresa] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerContext, setOwnerContext] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsOwner(session?.user?.app_metadata?.platform_role === "owner");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsOwner(session?.user?.app_metadata?.platform_role === "owner");
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: any = null;
    try {
      unsubscribe = onMessageListener((payload) => {
        let title = "Nova Notificação";
        let body = "Você tem uma nova mensagem.";

        if (payload.notification) {
          title = payload.notification.title || title;
          body = payload.notification.body || body;
        } else if (
          payload.data &&
          (payload.data.title || payload.data.message || payload.data.body)
        ) {
          title = payload.data.title || title;
          body = payload.data.body || payload.data.message || body;
        }

        // Se a tab está aberta, podemos mostrar um alerta customizado ou nativo
        if (Notification.permission === "granted") {
          const notification = new Notification(title, {
            body: body,
            icon: "/icons/icone2.png",
            data: payload.data,
          });
          notification.onclick = (event) => {
            event.preventDefault();
            notification.close();
            const data = payload.data || {};
            let targetUrl = "/";
            if (data.route) targetUrl = data.route;
            else if (data.link) targetUrl = data.link;
            else if (data.communication_id) targetUrl = "/admin/comunicacoes";
            else if (data.presenca_id) targetUrl = "/admin/auditoria";
            window.location.href = targetUrl;
          };
        } else {
          alert(`${title}\n${body}`);
        }
      });
    } catch (e) {
      console.error("Error setting up foreground push listener:", e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      let storedUserStr = null;
      try {
        const { value } = await Preferences.get({ key: "@diarias:usuario" });
        storedUserStr = value;
      } catch (e) {}

      if (!storedUserStr) {
        storedUserStr = localStorage.getItem("@diarias:usuario");
      }

      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          
          if (parsed.id === '00000000-0000-0000-0000-000000000000') {
            const ctxStr = localStorage.getItem('@diarias:owner_empresa_context');
            if (ctxStr) {
               const ctx = JSON.parse(ctxStr);
               setUsuario(parsed);
               setEmpresa(ctx);
               setOwnerContext(ctx);
               setLoading(false);
               return;
            }
          }
          const res = await api.checkUserActive(parsed.id);


          if (res.data && res.data.ativo) {
            setUsuario(res.data);
            if (res.data.empresa_id) {
              const emp = await (api as any).getEmpresa(res.data.empresa_id);
              setEmpresa(emp);
            }
            setupPushNotifications(res.data.id);
          } else if (res.data && !res.data.ativo) {
            // Disabled by admin
            setUsuario(null);
            localStorage.removeItem("@diarias:usuario");
            await Preferences.remove({ key: "@diarias:usuario" });
          } else if (res.error && res.error.code === "PGRST116") {
            // User deleted
            setUsuario(null);
            localStorage.removeItem("@diarias:usuario");
            await Preferences.remove({ key: "@diarias:usuario" });
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

  
  const accessCompany = async (empresaId: string) => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const emp = await (api as any).getEmpresa(empresaId);
      const pseudoUser = {
        id: '00000000-0000-0000-0000-000000000000',
        usuario: 'Platform Owner',
        nome: 'Owner Administrator',
        perfil: 'ADMIN',
        empresa_id: empresaId,
        ativo: true,
      };
      localStorage.setItem('@diarias:usuario', JSON.stringify(pseudoUser));
      localStorage.setItem('@diarias:owner_empresa_context', JSON.stringify(emp));
      setUsuario(pseudoUser);
      setEmpresa(emp);
      setOwnerContext(emp);
      window.location.href = '/admin/dashboard';
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exitCompany = () => {
    localStorage.removeItem('@diarias:usuario');
    localStorage.removeItem('@diarias:owner_empresa_context');
    setUsuario(null);
    setEmpresa(null);
    setOwnerContext(null);
    window.location.href = '/owner/empresas';
  };

  const login = async (user: string, pass: string) => {

    setLoading(true);
    try {
      const u = await api.login(user, pass);
      if (u) {
        setUsuario(u);
        if (u.empresa_id) {
          const emp = await (api as any).getEmpresa(u.empresa_id);
          setEmpresa(emp);
        }
        setupPushNotifications(u.id);
        localStorage.setItem("@diarias:usuario", JSON.stringify(u));
        try {
          await Preferences.set({
            key: "@diarias:usuario",
            value: JSON.stringify(u),
          });
        } catch (e) {}
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
    // 0. Deactivate token
    const token = localStorage.getItem("@diarias:push_token");
    if (token) {
      api.deactivatePushDevice(token).catch((e) => console.error(e));
      localStorage.removeItem("@diarias:push_token");
    }

    // 1. Limpar estado local imediatamente (sem await) para feedback visual instantâneo
    setUsuario(null);
    setEmpresa(null);
    localStorage.removeItem("@diarias:usuario");
    try {
      Preferences.remove({ key: "@diarias:usuario" });
    } catch (e) {}
    localStorage.removeItem("supabase.auth.token");

    // 2. Redirecionar imediatamente para a tela de login
    window.location.href = "/login";

    // 3. Fazer o signOut no backend em background (fire-and-forget), sem bloquear a UI
  };

  return (
    <AuthContext.Provider value={{ usuario, empresa, login, logout, loading, isOwner, accessCompany, exitCompany, ownerContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

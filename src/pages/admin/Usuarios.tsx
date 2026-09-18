import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  Shield,
  Building2,
  Lock,
  X,
  Check,
  AlertTriangle,
  Info,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { CenteredDialog } from "../../components/ui/CenteredDialog";
import { serverApi } from "../../lib/server-api";
import type { Perfil, PermissaoCatalogo, UsuarioDetalhado, Obra } from "../../lib/types";

interface ApiResponse {
  usuarios: UsuarioDetalhado[];
  obras: Obra[];
  permissoes_catalogo: PermissaoCatalogo[];
}

const emptyForm = {
  id: null as string | null,
  nome: "",
  login: "",
  email: "",
  perfil: "OPERADOR" as Perfil,
  senha: "",
  acesso_obras_tipo: "TODAS" as "TODAS" | "SELECIONADAS",
  obras_ids: [] as string[],
  modo_permissoes: "PADRAO_PERFIL" as "PADRAO_PERFIL" | "PERSONALIZADO",
  permissoes: [] as string[],
};

export default function UsuariosAdmin() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === "ADMIN";

  const [usuarios, setUsuarios] = useState<UsuarioDetalhado[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [catalogo, setCatalogo] = useState<PermissaoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [perfilFilter, setPerfilFilter] = useState<string>("TODOS");

  // Modal de edição / criação
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "obras" | "permissoes">("dados");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Modal de confirmação de inativação/ativação
  const [confirmUser, setConfirmUser] = useState<UsuarioDetalhado | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const busy = useRef(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await serverApi<ApiResponse>("/api/usuarios");
      setUsuarios(data.usuarios || []);
      setObras(data.obras || []);
      setCatalogo(data.permissoes_catalogo || []);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a lista de usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin]);

  // Contagem de administradores ativos para proteção
  const activeAdminsCount = useMemo(() => {
    return usuarios.filter((u) => u.perfil === "ADMIN" && u.ativo).length;
  }, [usuarios]);

  // Filtragem da lista
  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de status
      if (statusFilter === "ativos" && !u.ativo) return false;
      if (statusFilter === "inativos" && u.ativo) return false;

      // Filtro de perfil
      if (perfilFilter !== "TODOS" && u.perfil !== perfilFilter) return false;

      // Busca textual
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchNome = (u.nome || "").toLowerCase().includes(q);
        const matchLogin = (u.login || u.usuario || "").toLowerCase().includes(q);
        const matchEmail = (u.email || "").toLowerCase().includes(q);
        if (!matchNome && !matchLogin && !matchEmail) return false;
      }

      return true;
    });
  }, [usuarios, statusFilter, perfilFilter, search]);

  function handleOpenCreate() {
    setForm({
      ...emptyForm,
      perfil: "OPERADOR",
      acesso_obras_tipo: "TODAS",
      obras_ids: [],
      modo_permissoes: "PADRAO_PERFIL",
      permissoes: [],
    });
    setActiveTab("dados");
    setModalError("");
    setModalOpen(true);
  }

  function handleOpenEdit(u: UsuarioDetalhado) {
    setForm({
      id: u.id,
      nome: u.nome || "",
      login: u.login || u.usuario || "",
      email: u.email || "",
      perfil: u.perfil,
      senha: "",
      acesso_obras_tipo: u.acesso_obras_tipo || "TODAS",
      obras_ids: u.obras_ids || [],
      modo_permissoes: u.modo_permissoes || "PADRAO_PERFIL",
      permissoes: u.permissoes || [],
    });
    setActiveTab("dados");
    setModalError("");
    setModalOpen(true);
  }

  function handleCloseModal() {
    if (!saving) {
      setModalOpen(false);
      setModalError("");
    }
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setModalError("");

    try {
      const isEditing = !!form.id;

      // Validações básicas no cliente
      if (!form.nome.trim()) {
        throw new Error("Por favor, informe o nome completo do usuário.");
      }
      if (!form.login.trim()) {
        throw new Error("Por favor, informe o login de acesso do usuário.");
      }
      if (!isEditing && (!form.senha || form.senha.length < 6)) {
        throw new Error("A senha inicial deve conter no mínimo 6 caracteres.");
      }
      if (isEditing && form.senha && form.senha.length < 6) {
        throw new Error("A nova senha deve conter no mínimo 6 caracteres.");
      }

      const payload = {
        action: isEditing ? "update" : "create",
        id: form.id,
        nome: form.nome.trim(),
        login: form.login.trim().toLowerCase(),
        email: form.email.trim() || null,
        perfil: form.perfil,
        senha: form.senha || undefined,
        acesso_obras_tipo: form.acesso_obras_tipo,
        obras_ids: form.obras_ids,
        modo_permissoes: form.modo_permissoes,
        permissoes: form.permissoes,
      };

      await serverApi("/api/usuarios", payload, "POST");

      setModalOpen(false);
      setSuccess(isEditing ? "Usuário atualizado com sucesso." : "Novo usuário cadastrado com sucesso.");
      setTimeout(() => setSuccess(""), 5000);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Erro ao salvar usuário.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function handleConfirmToggleStatus() {
    if (!confirmUser || busy.current) return;
    busy.current = true;
    setConfirmLoading(true);
    setError("");

    try {
      await serverApi(
        "/api/usuarios",
        {
          action: "toggle_status",
          id: confirmUser.id,
          ativo: !confirmUser.ativo,
        },
        "POST"
      );

      const actionText = confirmUser.ativo ? "inativado e arquivado" : "ativado";
      setSuccess(`Usuário ${confirmUser.nome} ${actionText} com sucesso.`);
      setTimeout(() => setSuccess(""), 5000);
      setConfirmUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar status do usuário.");
      setConfirmUser(null);
    } finally {
      busy.current = false;
      setConfirmLoading(false);
    }
  }

  // Agrupamento de permissões por módulo para exibição organizada
  const catalogoPorModulo = useMemo(() => {
    const map: Record<string, PermissaoCatalogo[]> = {};
    for (const p of catalogo) {
      const mod = p.modulo || "Geral";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return map;
  }, [catalogo]);

  // Mapa de obras por ID para consulta rápida de nomes
  const obrasMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of obras) {
      map[o.id] = o.nome;
    }
    return map;
  }, [obras]);

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl flex items-center gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0" />
        <p className="font-medium">Acesso restrito ao administrador da empresa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900">
            <Users className="text-blue-600" />
            Usuários e Permissões
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Controle de acesso, perfis operacionais e permissões por obra para a equipe da sua empresa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          <Plus size={18} />
          Cadastrar Usuário
        </button>
      </div>

      {/* Alertas de sucesso e erro */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-700 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, login ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de perfil */}
          <select
            value={perfilFilter}
            onChange={(e) => setPerfilFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os perfis</option>
            <option value="ADMIN">Administrador (ADMIN)</option>
            <option value="OPERADOR">Operador (OPERADOR)</option>
            <option value="CONSULTA">Consulta (CONSULTA)</option>
          </select>

          {/* Filtro de status */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-sm">
            <button
              onClick={() => setStatusFilter("ativos")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === "ativos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ativos ({usuarios.filter((u) => u.ativo).length})
            </button>
            <button
              onClick={() => setStatusFilter("inativos")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === "inativos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inativos ({usuarios.filter((u) => !u.ativo).length})
            </button>
            <button
              onClick={() => setStatusFilter("todos")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === "todos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({usuarios.length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Carregando usuários e permissões...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="text-base font-medium text-slate-700">Nenhum usuário encontrado</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Tente ajustar os filtros ou cadastre um novo colaborador.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">Colaborador</th>
                  <th className="px-4 py-3.5">Perfil</th>
                  <th className="px-4 py-3.5">Acesso a Obras</th>
                  <th className="px-4 py-3.5">Permissões</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCarlos = (u.login || u.usuario || "").toLowerCase() === "carlos";
                  const isSoleAdmin = u.perfil === "ADMIN" && u.ativo && activeAdminsCount <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      {/* Nome e Login */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-sm border border-slate-200 flex-shrink-0">
                            {(u.nome || u.usuario || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{u.nome || u.usuario}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>@{u.login || u.usuario}</span>
                              {u.email && (
                                <>
                                  <span>•</span>
                                  <span>{u.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil */}
                      <td className="px-4 py-4">
                        {u.perfil === "ADMIN" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            <Shield size={12} />
                            ADMIN
                          </span>
                        )}
                        {u.perfil === "OPERADOR" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            OPERADOR
                          </span>
                        )}
                        {u.perfil === "CONSULTA" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            CONSULTA
                          </span>
                        )}
                      </td>

                      {/* Acesso a Obras */}
                      <td className="px-4 py-4">
                        {u.acesso_obras_tipo === "SELECIONADAS" && (u.obras_ids || []).length > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Building2 size={12} />
                              {u.obras_ids!.length} obra{u.obras_ids!.length > 1 ? "s" : ""}
                            </span>
                            <div className="text-xs text-slate-400 max-w-[200px] truncate" title={u.obras_ids!.map(id => obrasMap[id] || id).join(", ")}>
                              {u.obras_ids!.map(id => obrasMap[id] || id).join(", ")}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Building2 size={12} />
                            Todas as Obras
                          </span>
                        )}
                      </td>

                      {/* Permissões */}
                      <td className="px-4 py-4">
                        {u.modo_permissoes === "PERSONALIZADO" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <KeyRound size={12} />
                            Personalizado ({u.permissoes?.length || 0})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Padrão do Perfil
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Inativo {u.arquivado && "(Arquivado)"}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar usuário e permissões"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil size={16} />
                          </button>

                          {u.ativo ? (
                            <button
                              onClick={() => setConfirmUser(u)}
                              disabled={isSoleAdmin}
                              title={
                                isSoleAdmin
                                  ? "Não é permitido inativar o único administrador da empresa"
                                  : "Inativar / Arquivar usuário"
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmUser(u)}
                              disabled={isCarlos}
                              title={
                                isCarlos
                                  ? "Usuário Carlos permanece inativo por determinação do sistema"
                                  : "Reativar usuário"
                              }
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <CenteredDialog labelId="modal-usuario-title" onClose={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 id="modal-usuario-title" className="text-lg font-bold text-slate-900">
                  {form.id ? "Editar Usuário" : "Novo Usuário"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure perfil, dados de login, obras permitidas e privilégios de acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas do Modal */}
            <div className="flex border-b border-slate-200 px-5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveTab("dados")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition -mb-px flex items-center gap-1.5 ${
                  activeTab === "dados"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users size={16} />
                Dados Gerais
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("obras")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition -mb-px flex items-center gap-1.5 ${
                  activeTab === "obras"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 size={16} />
                Acesso a Obras
                {form.acesso_obras_tipo === "SELECIONADAS" && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                    {form.obras_ids.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("permissoes")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition -mb-px flex items-center gap-1.5 ${
                  activeTab === "permissoes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Lock size={16} />
                Permissões
                {form.modo_permissoes === "PERSONALIZADO" && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
                    {form.permissoes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleSaveUser} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* ABA 1: DADOS GERAIS */}
                {activeTab === "dados" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        placeholder="Ex: João da Silva"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Login de Acesso *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.login}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              login: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                            })
                          }
                          placeholder="ex: joao.silva"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Apenas letras minúsculas, números, ponto ou traço.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          E-mail Corporativo
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="ex: joao@empresa.com"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Perfil de Acesso *
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <label
                          className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                            form.perfil === "ADMIN"
                              ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="perfil"
                            value="ADMIN"
                            checked={form.perfil === "ADMIN"}
                            onChange={() => setForm({ ...form, perfil: "ADMIN" })}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                            <Shield size={14} className="text-purple-600" />
                            ADMIN
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1">
                            Acesso total, gestão da empresa e cadastros.
                          </span>
                        </label>

                        <label
                          className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                            form.perfil === "OPERADOR"
                              ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="perfil"
                            value="OPERADOR"
                            checked={form.perfil === "OPERADOR"}
                            onChange={() => setForm({ ...form, perfil: "OPERADOR" })}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                            OPERADOR
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1">
                            Lançamento em campo, presenças e ferramentas.
                          </span>
                        </label>

                        <label
                          className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                            form.perfil === "CONSULTA"
                              ? "border-slate-600 bg-slate-100/60 ring-1 ring-slate-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="perfil"
                            value="CONSULTA"
                            checked={form.perfil === "CONSULTA"}
                            onChange={() => setForm({ ...form, perfil: "CONSULTA" })}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            CONSULTA
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1">
                            Visualização de relatórios e auditorias.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {form.id ? "Nova Senha (opcional)" : "Senha Inicial *"}
                      </label>
                      <input
                        type="password"
                        required={!form.id}
                        minLength={6}
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                        placeholder={form.id ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {form.id && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Info size={12} className="text-slate-400" />
                          Alterar a senha desconecta sessões ativas do usuário.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA 2: ACESSO A OBRAS */}
                {activeTab === "obras" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 block">
                        Modo de Acesso a Obras
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            form.acesso_obras_tipo === "TODAS"
                              ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="acesso_obras_tipo"
                            checked={form.acesso_obras_tipo === "TODAS"}
                            onChange={() => setForm({ ...form, acesso_obras_tipo: "TODAS" })}
                            className="mt-0.5 text-emerald-600"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">
                              Todas as Obras
                            </span>
                            <span className="text-xs text-slate-500">
                              O usuário visualiza e opera em qualquer obra cadastrada na empresa.
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            form.acesso_obras_tipo === "SELECIONADAS"
                              ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="acesso_obras_tipo"
                            checked={form.acesso_obras_tipo === "SELECIONADAS"}
                            onChange={() => setForm({ ...form, acesso_obras_tipo: "SELECIONADAS" })}
                            className="mt-0.5 text-blue-600"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">
                              Obras Específicas
                            </span>
                            <span className="text-xs text-slate-500">
                              Restringir a atuação do usuário apenas às obras marcadas abaixo.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {form.acesso_obras_tipo === "SELECIONADAS" && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Selecione as Obras Permitidas ({form.obras_ids.length} selecionadas)
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  obras_ids: obras.map((o) => o.id),
                                })
                              }
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Selecionar todas
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, obras_ids: [] })}
                              className="text-xs text-slate-500 hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                          {obras.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-400">
                              Nenhuma obra ativa cadastrada.
                            </p>
                          ) : (
                            obras.map((o) => {
                              const checked = form.obras_ids.includes(o.id);
                              return (
                                <label
                                  key={o.id}
                                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer transition text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setForm({ ...form, obras_ids: [...form.obras_ids, o.id] });
                                      } else {
                                        setForm({
                                          ...form,
                                          obras_ids: form.obras_ids.filter((id) => id !== o.id),
                                        });
                                      }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-slate-800 font-medium">{o.nome}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 3: PERMISSÕES */}
                {activeTab === "permissoes" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 block">
                        Modo de Permissões
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            form.modo_permissoes === "PADRAO_PERFIL"
                              ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="modo_permissoes"
                            checked={form.modo_permissoes === "PADRAO_PERFIL"}
                            onChange={() => setForm({ ...form, modo_permissoes: "PADRAO_PERFIL" })}
                            className="mt-0.5 text-blue-600"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">
                              Padrão do Perfil
                            </span>
                            <span className="text-xs text-slate-500">
                              Usa as permissões padrão recomendadas para o perfil {form.perfil}.
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            form.modo_permissoes === "PERSONALIZADO"
                              ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="modo_permissoes"
                            checked={form.modo_permissoes === "PERSONALIZADO"}
                            onChange={() => setForm({ ...form, modo_permissoes: "PERSONALIZADO" })}
                            className="mt-0.5 text-indigo-600"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">
                              Personalizado
                            </span>
                            <span className="text-xs text-slate-500">
                              Configurar manualmente cada privilégio individual da lista.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {form.modo_permissoes === "PADRAO_PERFIL" ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Info size={14} className="text-blue-600" />
                          Regras padrão ativas para {form.perfil}:
                        </div>
                        {form.perfil === "ADMIN" && (
                          <p>
                            • Acesso irrestrito a todos os módulos, cadastros, relatórios e configurações da empresa.
                          </p>
                        )}
                        {form.perfil === "OPERADOR" && (
                          <p>
                            • Acesso a obras vinculadas, registro diário de presenças, empréstimos de ferramentas e visualização de dados básicos.
                          </p>
                        )}
                        {form.perfil === "CONSULTA" && (
                          <p>
                            • Acesso de somente leitura para relatórios gerenciais, auditoria de presenças e folhas de diárias.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                        {Object.entries(catalogoPorModulo).map(([modulo, items]) => (
                          <div key={modulo} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                              {modulo}
                            </div>
                            <div className="divide-y divide-slate-100 bg-white">
                              {items.map((item) => {
                                const checked = form.permissoes.includes(item.codigo);
                                return (
                                  <label
                                    key={item.codigo}
                                    className="flex items-start gap-3 p-3 hover:bg-slate-50/80 cursor-pointer transition"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setForm({
                                            ...form,
                                            permissoes: [...form.permissoes, item.codigo],
                                          });
                                        } else {
                                          setForm({
                                            ...form,
                                            permissoes: form.permissoes.filter((c) => c !== item.codigo),
                                          });
                                        }
                                      }}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                                    />
                                    <div>
                                      <div className="text-xs font-semibold text-slate-800">
                                        {item.nome}
                                      </div>
                                      {item.descricao && (
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                          {item.descricao}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {form.id ? "Salvar Alterações" : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </CenteredDialog>
      )}

      {/* Modal de Confirmação de Inativação / Reativação */}
      {confirmUser && (
        <CenteredDialog labelId="modal-confirm-title" onClose={() => !confirmLoading && setConfirmUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmUser.ativo ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {confirmUser.ativo ? <UserX size={20} /> : <UserCheck size={20} />}
              </div>
              <div>
                <h3 id="modal-confirm-title" className="text-lg font-bold text-slate-900">
                  {confirmUser.ativo ? "Inativar Usuário" : "Reativar Usuário"}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmUser.nome} (@{confirmUser.login || confirmUser.usuario})
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-2">
              {confirmUser.ativo ? (
                <>
                  <p>
                    Tem certeza de que deseja inativar e arquivar o acesso deste usuário?
                  </p>
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <Info size={14} className="text-amber-600" />
                      Preservação do Histórico:
                    </p>
                    <p>
                      A inativação bloqueia novos acessos ao sistema, mas{" "}
                      <strong>não altera nem remove nenhum registro histórico</strong> (relatórios, diárias, presenças ou compras anteriores).
                    </p>
                  </div>
                </>
              ) : (
                <p>
                  Deseja restabelecer o acesso ao sistema para este usuário com as permissões e obras configuradas?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                disabled={confirmLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={confirmLoading}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition flex items-center gap-2 ${
                  confirmUser.ativo
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                }`}
              >
                {confirmLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {confirmUser.ativo ? "Sim, Inativar" : "Sim, Reativar"}
              </button>
            </div>
          </div>
        </CenteredDialog>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Plus, Package, Search, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { CenteredDialog } from "../../components/ui/CenteredDialog";
import { serverApi } from "../../lib/server-api";
import { api } from "../../lib/api";
const UNITS = [
  "SACO",
  "KG",
  "M",
  "M²",
  "M³",
  "LT",
  "UN",
  "BARRA",
  "PAR",
  "CHAPA",
  "ROLO",
  "CAIXA",
];
type Produto = {
  id: string;
  nome: string;
  categoria_id: string;
  unidade: string;
  unidades_permitidas: string[];
  observacao: string | null;
  ativo: boolean;
  category?: { nome: string };
};
const empty = {
  nome: "",
  categoria_id: "",
  unidade: "UN",
  unidades_permitidas: ["UN"],
  observacao: "",
};
export default function Produtos() {
  const { usuario } = useAuth();
  const admin = usuario?.perfil === "ADMIN";
  const [rows, setRows] = useState<Produto[]>([]),
    [categories, setCategories] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ativos"),
    [category, setCategory] = useState("");
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [success, setSuccess] = useState("");
  const busy = useRef(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, c] = await Promise.all([
        serverApi<Produto[]>("/api/produtos?todos=true"),
        api.getMaterialCategories(),
      ]);
      setRows(p);
      setCategories(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (admin) void load();
  }, [admin]);
  function close() {
    if (!busy.current) setOpen(false);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await serverApi(
        "/api/produtos",
        { ...form, ...(editing ? { id: editing } : {}) },
        editing ? "PATCH" : "POST",
      );
      setOpen(false);
      setSuccess("Produto salvo.");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function toggle(p: Produto) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await serverApi("/api/produtos", { id: p.id, ativo: !p.ativo }, "PATCH");
      setRows((old) =>
        old.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x)),
      );
      setSuccess(
        p.ativo
          ? "Produto desativado. O histórico foi preservado."
          : "Produto ativado.",
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  if (!admin) return <p>Acesso exclusivo do administrador.</p>;
  const filtered = rows.filter(
    (p) =>
      p.nome
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (!category || p.categoria_id === category) &&
      (status === "todos" || p.ativo === (status === "ativos")),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-blue-600" />
            Produtos
          </h1>
          <p className="text-slate-500 mt-1">
            Catálogo de materiais disponíveis nas compras.
          </p>
        </div>
        <button
          disabled={loading || saving || !!error}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 flex gap-2 disabled:opacity-50"
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setError("");
            setOpen(true);
          }}
        >
          <Plus />
          Cadastrar produto
        </button>
      </div>
      {error && !open && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">
          {error}{" "}
          <button className="underline" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      )}
      {success && (
        <p role="status" className="text-emerald-700">
          {success}
        </p>
      )}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border">
        <label className="flex items-center gap-2 flex-1">
          <Search size={18} />
          <input
            aria-label="Pesquisar produto"
            className="w-full p-2"
            placeholder="Pesquisar produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Categoria"
          className="border rounded-lg p-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className="border rounded-lg p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {[
                "Produto",
                "Categoria",
                "Padrão",
                "Unidades permitidas",
                "Status",
                "Ações",
              ].map((t) => (
                <th className="p-4" key={t}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-semibold">{p.nome}</td>
                  <td className="p-4">{p.category?.nome}</td>
                  <td className="p-4">{p.unidade}</td>
                  <td className="p-4">{p.unidades_permitidas.join(", ")}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full ${p.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <button
                      disabled={saving}
                      className="text-blue-600 mr-4"
                      onClick={() => {
                        setEditing(p.id);
                        setForm({
                          nome: p.nome,
                          categoria_id: p.categoria_id,
                          unidade: p.unidade,
                          unidades_permitidas: p.unidades_permitidas,
                          observacao: p.observacao || "",
                        });
                        setError("");
                        setOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      disabled={saving}
                      className="text-slate-600"
                      onClick={() => void toggle(p)}
                    >
                      {p.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            {(loading || !filtered.length) && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  {loading
                    ? "Carregando produtos…"
                    : error
                      ? "Lista indisponível."
                      : "Nenhum produto encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <CenteredDialog labelId="produto-title" onClose={close}>
          <form
            onSubmit={save}
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90dvh] overflow-y-auto p-6 space-y-5"
          >
            <div className="flex justify-between">
              <h2 id="produto-title" className="text-xl font-bold">
                {editing ? "Editar produto" : "Cadastrar produto"}
              </h2>
              <button
                type="button"
                aria-label="Fechar"
                disabled={saving}
                onClick={close}
              >
                <X />
              </button>
            </div>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <fieldset disabled={saving} className="space-y-4">
              <label className="block">
                Nome do produto
                <input
                  required
                  maxLength={160}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="block border rounded-lg p-3 w-full mt-1"
                />
              </label>
              <label className="block">
                Categoria
                <select
                  required
                  value={form.categoria_id}
                  onChange={(e) =>
                    setForm({ ...form, categoria_id: e.target.value })
                  }
                  className="block border rounded-lg p-3 w-full mt-1"
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Unidade padrão
                <select
                  value={form.unidade}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unidade: e.target.value,
                      unidades_permitidas: [
                        ...new Set([
                          ...form.unidades_permitidas,
                          e.target.value,
                        ]),
                      ],
                    })
                  }
                  className="block border rounded-lg p-3 w-full mt-1"
                >
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Unidades permitidas na compra</legend>
                <div className="flex flex-wrap gap-3 mt-2">
                  {UNITS.map((u) => (
                    <label
                      key={u}
                      className="border rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={form.unidades_permitidas.includes(u)}
                        disabled={u === form.unidade}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            unidades_permitidas: e.target.checked
                              ? [...form.unidades_permitidas, u]
                              : form.unidades_permitidas.filter((x) => x !== u),
                          })
                        }
                      />
                      {u}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                Observação <span className="text-slate-400">(opcional)</span>
                <textarea
                  maxLength={1000}
                  value={form.observacao}
                  onChange={(e) =>
                    setForm({ ...form, observacao: e.target.value })
                  }
                  className="block border rounded-lg p-3 w-full mt-1"
                />
              </label>
            </fieldset>
            <p className="text-sm text-slate-500">
              Preço e fornecedor são informados em cada compra. Alterações não
              convertem quantidades anteriores.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={close}
                className="border rounded-lg px-4 py-2"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
              >
                {saving ? "Salvando…" : "Salvar produto"}
              </button>
            </div>
          </form>
        </CenteredDialog>
      )}
    </div>
  );
}

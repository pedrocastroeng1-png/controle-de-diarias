import { useEffect, useRef, useState } from "react";
import { CalendarOff, Plus, Trash2, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { CenteredDialog } from "../../components/ui/CenteredDialog";
import type { Feriado } from "../../lib/types";
const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (d: string) => d.split("-").reverse().join("/");
export default function Feriados() {
  const { usuario } = useAuth();
  const admin = usuario?.perfil === "ADMIN";
  const [rows, setRows] = useState<Feriado[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState({
    data: "",
    descricao: "",
    id: null as string | null,
    operation: "create",
  });
  const busy = useRef(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.getFeriados());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function close() {
    if (!busy.current) setOpen(false);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await api.gerenciarFeriado({
        ...form,
        action: preview ? form.operation : "preview",
        fingerprint: preview?.fingerprint,
      });
      if (!preview) setPreview(result);
      else {
        setOpen(false);
        await load();
      }
    } catch (e: any) {
      setPreview(null);
      setError(e.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  if (!admin) return <p>Acesso exclusivo do administrador.</p>;
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex gap-2 items-center">
            <CalendarOff className="text-blue-600" />
            Feriados
          </h1>
          <p className="text-slate-500 mt-1">
            Dias não remunerados em todas as obras da empresa.
          </p>
        </div>
        <button
          disabled={loading || !!error}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 flex items-center gap-2 disabled:opacity-50"
          onClick={() => {
            setForm({ data: "", descricao: "", id: null, operation: "create" });
            setPreview(null);
            setError("");
            setOpen(true);
          }}
        >
          <Plus />
          Cadastrar feriado
        </button>
      </div>
      {error && !open && (
        <div role="alert" className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}{" "}
          <button onClick={() => void load()} className="underline">
            Tentar novamente
          </button>
        </div>
      )}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-4 whitespace-nowrap">{date(r.data)}</td>
                  <td className="p-4">{r.descricao}</td>
                  <td className="p-4 text-right">
                    <button
                      aria-label={`Remover ${r.descricao}`}
                      className="text-red-600"
                      onClick={() => {
                        setForm({
                          data: r.data,
                          descricao: r.descricao,
                          id: r.id,
                          operation: "delete",
                        });
                        setPreview(null);
                        setError("");
                        setOpen(true);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            {(loading || !rows.length) && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-500">
                  {loading
                    ? "Carregando…"
                    : error
                      ? "Lista indisponível."
                      : "Nenhum feriado cadastrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <CenteredDialog labelId="feriado-title" onClose={close}>
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-6 space-y-5"
          >
            <div className="flex justify-between">
              <h2 id="feriado-title" className="text-xl font-bold">
                {form.operation === "create" ? "Cadastrar" : "Remover"} feriado
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
            <fieldset
              disabled={saving || !!preview || form.operation === "delete"}
              className="space-y-4"
            >
              <label className="block">
                Data
                <input
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="block border rounded-lg p-3 w-full mt-1"
                />
              </label>
              <label className="block">
                Descrição
                <textarea
                  required
                  maxLength={500}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  className="block border rounded-lg p-3 w-full mt-1"
                />
              </label>
            </fieldset>
            {preview && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-semibold">Impacto em {date(form.data)}</p>
                  <p>
                    Antes: {money(preview.beforeTotal)} · Depois:{" "}
                    {money(preview.afterTotal)}
                  </p>
                  <p>
                    {preview.affectedCount} funcionários · {preview.days}{" "}
                    diárias{" "}
                    {form.operation === "create"
                      ? "retiradas"
                      : "restabelecidas"}
                  </p>
                  <p className="font-semibold">
                    Variação: {money(preview.afterTotal - preview.beforeTotal)}
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {preview.employees.map((r: any) => (
                    <div
                      key={r.id}
                      className="border-b py-2 flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {r.nome}
                        <span className="block text-slate-500">
                          {r.obra || "Sem obra"}
                        </span>
                      </span>
                      <span>
                        {r.days} diária(s) · {money(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-slate-500">
              Presenças e atestados originais serão preservados. Os valores
              representam diárias calculadas, não transferências bancárias.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                className="border px-4 py-2 rounded-lg"
                onClick={() => (preview ? setPreview(null) : close())}
              >
                {preview ? "Voltar" : "Cancelar"}
              </button>
              <button
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {saving
                  ? "Processando…"
                  : preview
                    ? "Confirmar alteração"
                    : "Conferir impacto"}
              </button>
            </div>
          </form>
        </CenteredDialog>
      )}
    </div>
  );
}

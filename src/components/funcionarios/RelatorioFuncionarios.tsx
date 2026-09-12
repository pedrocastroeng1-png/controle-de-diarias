import { useEffect, useRef, useState } from 'react';
import { api, getEmpresaId } from '../../lib/api';
import type { Funcionario } from '../../lib/types';

async function carregarFoto(f: Funcionario): Promise<string | null> {
  if (!f.photo_path) return null;
  const url = await api.getPhotoUrl('employee-photos', f.photo_path);
  if (!url) throw new Error(`Foto indisponível: ${f.nome}.`);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Falha ao carregar a foto de ${f.nome}.`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 360; canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx || !image.naturalWidth || !image.naturalHeight) throw new Error('Não foi possível preparar a foto.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 360, 450);
    const scale = Math.min(360 / image.naturalWidth, 450 / image.naturalHeight);
    const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
    ctx.drawImage(image, (360 - width) / 2, (450 - height) / 2, width, height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally { URL.revokeObjectURL(objectUrl); }
}

export default function RelatorioFuncionarios() {
  const [aberto, setAberto] = useState(false);
  const [grupo, setGrupo] = useState<'ativos' | 'inativos'>('ativos');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [progresso, setProgresso] = useState('');
  const [download, setDownload] = useState<{ url: string; nome: string } | null>(null);
  const ocupado = useRef(false);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; }, []);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);
  const lista = funcionarios.filter(f => f.ativo === (grupo === 'ativos'));
  async function abrir() {
    if (ocupado.current) return;
    ocupado.current = true;
    const current = ++sequence.current;
    setAberto(true); setCarregando(true); setErro(''); setDownload(null); setSelecionados([]); setFuncionarios([]);
    try {
      if (!getEmpresaId()) throw new Error('Empresa não identificada. Faça login novamente.');
      const dados = await api.getFuncionarios('todos');
      if (current === sequence.current) setFuncionarios(dados);
    } catch { if (current === sequence.current) setErro('Não foi possível carregar os funcionários. Feche e tente novamente.'); }
    finally { ocupado.current = false; if (current === sequence.current) setCarregando(false); }
  }
  async function gerar() {
    if (ocupado.current || !selecionados.length) return;
    ocupado.current = true;
    const current = sequence.current;
    setGerando(true); setErro(''); setDownload(null); setProgresso('Consultando o histórico completo…');
    try {
      const empresa = getEmpresaId();
      if (!empresa) throw new Error('Empresa não identificada. Faça login novamente.');
      const [{ funcionarios: atuais, registros }, { criarZipFuncionarios }] = await Promise.all([
        api.getRelatorioComAtestados(), import('../../lib/funcionarios-zip'),
      ]);
      const escolhidos = atuais.filter(f => selecionados.includes(f.id));
      if (getEmpresaId() !== empresa || escolhidos.length !== selecionados.length || escolhidos.some(f => f.empresa_id !== empresa || f.ativo !== (grupo === 'ativos'))) {
        throw new Error('O cadastro ou a empresa mudou. Feche o relatório e selecione novamente.');
      }
      const blob = await criarZipFuncionarios(escolhidos, registros, carregarFoto, (n, total) => {
        if (current === sequence.current) setProgresso(n === total ? 'Compactando os PDFs…' : `Preparando ficha ${n} de ${total}…`);
      });
      if (getEmpresaId() !== empresa) throw new Error('A empresa mudou durante a geração. Tente novamente.');
      if (current !== sequence.current) return;
      setDownload({ url: URL.createObjectURL(blob), nome: `funcionarios_${grupo}_${new Date().toISOString().slice(0, 10)}.zip` });
      setProgresso(`${escolhidos.length} fichas prontas. Clique em Baixar ZIP.`);
    } catch (error) {
      if (current === sequence.current) { setErro(error instanceof Error ? error.message : 'Não foi possível gerar o ZIP.'); setProgresso(''); }
    } finally { ocupado.current = false; if (current === sequence.current) setGerando(false); }
  }
  return <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4" aria-label="Relatório de funcionários">
    <button type="button" aria-expanded={aberto} aria-controls="relatorio-funcionarios" disabled={gerando || carregando}
      className="font-semibold text-blue-800 disabled:opacity-50" onClick={() => aberto ? setAberto(false) : void abrir()}>
      {aberto ? 'Fechar relatório de funcionários' : 'Relatório de Funcionários'}
    </button>
    {aberto && <div id="relatorio-funcionarios" className="mt-4 space-y-4">
      <p className="text-sm text-gray-600">Selecione os funcionários para baixar uma ficha PDF individual por cadastro em um arquivo ZIP. O total considera todo o histórico disponível de diárias. CLT terá somente dados cadastrais.</p>
      <label className="block text-sm font-medium">Grupo de funcionários
        <select value={grupo} disabled={gerando || carregando} onChange={e => { setGrupo(e.target.value as 'ativos' | 'inativos'); setSelecionados([]); setDownload(null); setProgresso(''); setErro(''); }} className="ml-3 rounded border p-2">
          <option value="ativos">Funcionários ativos</option><option value="inativos">Funcionários inativos</option>
        </select>
      </label>
      {carregando ? <p role="status">Carregando funcionários…</p> : <fieldset disabled={gerando} className="space-y-2">
        <legend className="text-sm mb-2">{lista.length} funcionários no grupo · {selecionados.length} selecionados</legend>
        <label className="flex gap-2 font-medium"><input type="checkbox" disabled={!lista.length} checked={lista.length > 0 && selecionados.length === lista.length}
          onChange={e => { setSelecionados(e.target.checked ? lista.map(f => f.id) : []); setDownload(null); setProgresso(''); }} />Selecionar todos</label>
        <div className="max-h-64 overflow-y-auto divide-y rounded border">
          {lista.map(f => <label key={f.id} className="flex items-start gap-3 p-3 cursor-pointer">
            <input className="mt-1" type="checkbox" checked={selecionados.includes(f.id)} onChange={e => { setSelecionados(ids => e.target.checked ? [...ids, f.id] : ids.filter(id => id !== f.id)); setDownload(null); setProgresso(''); }} />
            <span><span className="block font-medium">{f.nome}</span><span className="block text-sm text-gray-500">{f.funcao?.nome || 'Função não informada'} · {f.obra?.nome || 'Obra não informada'} · {f.tipo_colaborador}</span><span className="block text-xs text-gray-500">Cadastro: {f.id}</span></span>
          </label>)}
          {!lista.length && <p className="p-3 text-sm">Nenhum funcionário neste grupo.</p>}
        </div>
      </fieldset>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" disabled={carregando || gerando || !selecionados.length} onClick={() => void gerar()} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{gerando ? 'Gerando ZIP…' : 'Gerar ZIP'}</button>
        {download && <a href={download.url} download={download.nome} className="rounded bg-green-700 px-4 py-2 text-white">Baixar ZIP</a>}
        <span role="status" className="text-sm text-gray-600">{progresso}</span>
      </div>
    </div>}
  </section>;
}

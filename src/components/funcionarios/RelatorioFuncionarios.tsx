import { useEffect, useRef, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Search, Check, Download } from 'lucide-react';
import { api, getEmpresaId } from '../../lib/api';
import type { Funcionario } from '../../lib/types';
import { EmployeeAvatar } from './EmployeeAvatar';

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
  const [busca, setBusca] = useState('');
  
  const ocupado = useRef(false);
  const sequence = useRef(0);

  useEffect(() => () => { sequence.current++; }, []);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  const listaCompleta = funcionarios.filter(f => f.ativo === (grupo === 'ativos'));
  const lista = listaCompleta.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));

  async function abrir() {
    if (ocupado.current) return;
    ocupado.current = true;
    const current = ++sequence.current;
    setAberto(true); setCarregando(true); setErro(''); setDownload(null); setSelecionados([]); setFuncionarios([]); setBusca('');
    try {
      if (!getEmpresaId()) throw new Error('Empresa não identificada. Faça login novamente.');
      const dados = await api.getFuncionarios('todos');
      if (current === sequence.current) setFuncionarios(dados);
    } catch { 
      if (current === sequence.current) setErro('Não foi possível carregar os funcionários. Feche e tente novamente.'); 
    }
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
      setProgresso(`${escolhidos.length} fichas prontas.`);
    } catch (error) {
      if (current === sequence.current) { setErro(error instanceof Error ? error.message : 'Não foi possível gerar o ZIP.'); setProgresso(''); }
    } finally { ocupado.current = false; if (current === sequence.current) setGerando(false); }
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" aria-label="Relatório de funcionários">
      <button 
        type="button" 
        aria-expanded={aberto} 
        aria-controls="relatorio-funcionarios" 
        disabled={gerando || carregando}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-left" 
        onClick={() => aberto ? setAberto(false) : void abrir()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Relatório de Funcionários</h3>
            <p className="text-sm text-gray-500 font-normal">Gere arquivos PDF individuais compactados em ZIP.</p>
          </div>
        </div>
        <div className="text-gray-400">
          {aberto ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {aberto && (
        <div id="relatorio-funcionarios" className="p-5 border-t border-gray-100 bg-gray-50">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
            <div className="flex bg-gray-200/50 p-1 rounded-lg w-full md:w-auto">
              <button
                type="button"
                className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${grupo === 'ativos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => { setGrupo('ativos'); setSelecionados([]); setDownload(null); setProgresso(''); setErro(''); setBusca(''); }}
              >
                Ativos
              </button>
              <button
                type="button"
                className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${grupo === 'inativos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => { setGrupo('inativos'); setSelecionados([]); setDownload(null); setProgresso(''); setErro(''); setBusca(''); }}
              >
                Inativos
              </button>
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar funcionário..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white shadow-sm"
              />
            </div>
          </div>

          {carregando ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Carregando funcionários...
            </div>
          ) : (
            <fieldset disabled={gerando} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-medium text-sm text-gray-700 cursor-pointer">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      disabled={!lista.length} 
                      checked={lista.length > 0 && selecionados.length === lista.length}
                      onChange={e => { 
                        setSelecionados(e.target.checked ? lista.map(f => f.id) : []); 
                        setDownload(null); 
                        setProgresso(''); 
                      }} 
                      className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                  </div>
                  Selecionar todos na busca
                </label>
                <span className="text-sm text-gray-500 font-medium">
                  {selecionados.length} / {listaCompleta.length} selecionados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                {lista.map(f => (
                  <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selecionados.includes(f.id) ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <input 
                      type="checkbox" 
                      checked={selecionados.includes(f.id)} 
                      onChange={e => { 
                        setSelecionados(ids => e.target.checked ? [...ids, f.id] : ids.filter(id => id !== f.id)); 
                        setDownload(null); 
                        setProgresso(''); 
                      }} 
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 shrink-0"
                    />
                    <EmployeeAvatar nome={f.nome} photoPath={f.photo_path} className="w-10 h-10 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">{f.nome}</span>
                      <span className="text-xs text-gray-500 truncate">{f.funcao?.nome || '-'} • {f.obra?.nome || '-'}</span>
                    </div>
                  </label>
                ))}
                {!lista.length && (
                  <div className="col-span-full py-8 text-center text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    Nenhum funcionário encontrado.
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {erro && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center">
              {erro}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              disabled={carregando || gerando || !selecionados.length} 
              onClick={() => void gerar()} 
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {gerando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando ZIP…
                </>
              ) : (
                `Gerar ZIP com ${selecionados.length} selecionado(s)`
              )}
            </button>
            
            {download && (
              <a 
                href={download.url} 
                download={download.nome} 
                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar arquivo ZIP
              </a>
            )}
            
            <span role="status" className="text-sm font-medium text-gray-600 ml-auto">
              {progresso}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

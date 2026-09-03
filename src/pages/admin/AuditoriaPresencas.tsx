import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../lib/api';
import { Funcionario, Presenca, Obra, Funcao } from '../../lib/types';
import { Search, Loader2, Camera, Calendar, Clock, User, CheckCircle2, ChevronDown, DollarSign, Users, Briefcase, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuditoriaPresencas() {
  const [activeTab, setActiveTab] = useState<'quadro' | 'fotos'>('quadro');
  const { usuario } = useAuth();
  
  // ==========================================
  // ESTADO - QUADRO ATUAL
  // ==========================================
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);

  // ==========================================
  // ESTADO - AUDITORIA DE FOTOS (PRESERVADO)
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<Funcionario[]>([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPresenca, setSelectedPresenca] = useState<Presenca | null>(null);
  const [registrationPhotoUrl, setRegistrationPhotoUrl] = useState<string>('');
  const [attendancePhotoUrl, setAttendancePhotoUrl] = useState<string>('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [funcData, obrasData, funcoesData] = await Promise.all([
        api.getFuncionarios('todos', true),
        api.getObras(),
        api.getFuncoes()
      ]);
      
      const activeFuncs = funcData
        .filter(f => f.ativo)
        .sort((a, b) => a.nome.localeCompare(b.nome));

      const allFuncs = funcData.sort((a, b) => a.nome.localeCompare(b.nome));

      setFuncionarios(allFuncs);
      setFilteredFuncionarios(allFuncs);
      setObras(obrasData);
      setFuncoes(funcoesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LOGIC - AUDITORIA DE FOTOS
  // ==========================================
  useEffect(() => {
    if (selectedFuncionario && searchTerm === selectedFuncionario.nome) {
      setFilteredFuncionarios(funcionarios);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredFuncionarios(
        funcionarios.filter(f => f.nome.toLowerCase().includes(term))
      );
    }
  }, [searchTerm, funcionarios, selectedFuncionario]);

  async function handleSelectFuncionario(f: Funcionario) {
    setSelectedFuncionario(f);
    setSearchTerm(f.nome);
    setLoadingFotos(true);
    setPresencas([]);
    setRegistrationPhotoUrl('');
    
    try {
      if (f.photo_path) {
        try {
          const url = await api.getPhotoUrl('employee-photos', f.photo_path);
          setRegistrationPhotoUrl(url);
        } catch (err) {
          setRegistrationPhotoUrl('ERROR');
        }
      }
      
      const history = await api.getAuditoriaPresencas(f.id);
      let atestados: any[] = [];
      try {
        atestados = await api.getAtestados();
      } catch (err) {}
      
      const atestadosForFunc = atestados.filter(a => a.employee_id === f.id);
      const generatedAtestados: any[] = [];
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 15);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      atestadosForFunc.forEach(a => {
        let curr = new Date(a.start_date);
        let end = new Date(a.end_date);
        while (curr <= end) {
          const dateStr = curr.toISOString().split('T')[0];
          if (dateStr >= dataLimiteStr) {
            generatedAtestados.push({
              id: `atestado-${a.id}-${dateStr}`,
              data: dateStr,
              photo_path: a.photo_path,
              photo_bucket: 'medical-certificates',
              is_atestado: true
            });
          }
          curr.setDate(curr.getDate() + 1);
        }
      });
      
      const merged = [...history, ...generatedAtestados].sort((a, b) => b.data.localeCompare(a.data));
      setPresencas(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFotos(false);
    }
  }

  async function openModal(presenca: Presenca) {
    setSelectedPresenca(presenca);
    setAttendancePhotoUrl('');
    
    try {
      if (presenca.photo_path) {
         const photoDate = (presenca as any).photo_taken_at ? new Date((presenca as any).photo_taken_at) : new Date((presenca as any).created_at || presenca.data);
         const twentyDaysAgo = new Date();
         twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
         
         if (photoDate < twentyDaysAgo) {
            setAttendancePhotoUrl('EXPIRED');
         } else {
            const bucket = (presenca as any).is_atestado ? 'medical-certificates' : 'attendance-photos';
            const url = await api.getPhotoUrl(bucket, presenca.photo_path);
            setAttendancePhotoUrl(url);
         }
      }
    } catch (err) {
      setAttendancePhotoUrl('ERROR');
    } finally {
      setModalOpen(true);
    }
  }

  // ==========================================
  // LOGIC - QUADRO ATUAL
  // ==========================================
  const hierarchy = useMemo(() => {
    const principalObras = obras.filter(o => !o.parent_obra_id);
    return principalObras.map(principal => {
      const subobras = obras.filter(o => o.parent_obra_id === principal.id);
      
      // Calculate consolidated employees
      const subObrasIds = subobras.map(so => so.id);
      const allObraIds = [principal.id, ...subObrasIds];
      const employeesInTree = funcionarios.filter(f => f.ativo && allObraIds.includes(f.obra_id));
      
      const fnCount = employeesInTree.reduce((acc, emp) => {
        const funcao = funcoes.find(fn => fn.id === emp.funcao_id);
        const fnName = funcao ? funcao.nome : 'Sem Função';
        acc[fnName] = (acc[fnName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...principal,
        subobras: subobras.map(sub => {
          const emps = funcionarios.filter(f => f.ativo && f.obra_id === sub.id);
          const sFnCount = emps.reduce((acc, emp) => {
            const funcao = funcoes.find(fn => fn.id === emp.funcao_id);
            const fnName = funcao ? funcao.nome : 'Sem Função';
            acc[fnName] = (acc[fnName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return {
            ...sub,
            total: emps.length,
            funcoesCount: sFnCount
          };
        }),
        total: employeesInTree.length,
        funcoesCount: fnCount
      };
    });
  }, [obras, funcionarios, funcoes]);

  const selectedObra = selectedObraId ? hierarchy.find(h => h.id === selectedObraId) : null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auditoria & Quadro Atual</h1>
        <p className="text-gray-500 text-sm mt-1">Visão em tempo real da equipe e auditoria fotográfica</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-4 shadow-sm">
        <button
          onClick={() => setActiveTab('quadro')}
          className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'quadro'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Quadro Atual
        </button>
        <button
          onClick={() => setActiveTab('fotos')}
          className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'fotos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Auditoria de Fotos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : activeTab === 'quadro' ? (
        <div className="space-y-6">
          {!selectedObra ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hierarchy.map(obra => (
                <div key={obra.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-slate-800 p-4 text-white">
                    <h3 className="font-bold text-lg truncate">{obra.nome}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-300">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{obra.total} funcionários</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumo por Função</h4>
                    <div className="space-y-2">
                      {Object.entries(obra.funcoesCount).map(([funcao, count]) => (
                        <div key={funcao} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{funcao}</span>
                          <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-900">{count}</span>
                        </div>
                      ))}
                      {Object.keys(obra.funcoesCount).length === 0 && (
                        <p className="text-sm text-gray-400 italic">Nenhum funcionário ativo.</p>
                      )}
                    </div>
                  </div>
                  {obra.subobras.length > 0 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedObraId(obra.id)}
                        className="w-full flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <span>Ver {obra.subobras.length} Subobras</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {hierarchy.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500">
                  Nenhuma obra cadastrada.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">
                <div>
                  <button
                    onClick={() => setSelectedObraId(null)}
                    className="text-slate-300 hover:text-white flex items-center gap-1 text-sm font-medium mb-3 transition-colors"
                  >
                    ← Voltar para Obras
                  </button>
                  <h2 className="text-2xl font-bold">{selectedObra.nome}</h2>
                  <div className="flex items-center gap-2 mt-2 text-slate-300">
                    <Users className="w-5 h-5" />
                    <span className="font-medium text-lg">Total Consolidado: {selectedObra.total} funcionários</span>
                  </div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg min-w-[250px]">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Total por Função (Consolidado)</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(selectedObra.funcoesCount).map(([funcao, count]) => (
                      <div key={funcao} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300 truncate pr-2">{funcao}</span>
                        <span className="font-semibold text-white bg-slate-600 px-2 py-0.5 rounded">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  Subobras ({selectedObra.subobras.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedObra.subobras.map(sub => (
                    <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{sub.nome}</h4>
                      <p className="text-sm font-medium text-blue-600 mb-4">{sub.total} funcionários</p>
                      
                      <div className="space-y-2">
                        {Object.entries(sub.funcoesCount).map(([funcao, count]) => (
                          <div key={funcao} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-600">{funcao}</span>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                          </div>
                        ))}
                        {Object.keys(sub.funcoesCount).length === 0 && (
                          <p className="text-sm text-gray-400 italic">Sem funcionários alocados</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* AUDITORIA DE FOTOS - ORIGINAL CODE */}
            <div className="border-r border-gray-100 flex flex-col bg-gray-50/50">
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Buscar funcionário..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredFuncionarios.length > 0 ? (
                        filteredFuncionarios.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              handleSelectFuncionario(f);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm focus:outline-none focus:bg-gray-50"
                          >
                            <div className="font-medium text-gray-900">{f.nome}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum funcionário encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedFuncionario ? (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
                      <User className="h-10 w-10" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{selectedFuncionario.nome}</h3>
                    <p className="text-sm text-gray-500 mb-6">Auditoria fotográfica</p>
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 flex items-start text-left">
                      <Camera className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-blue-600" />
                      <p>As fotos são armazenadas por 20 dias corridos conforme política de retenção.</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <User className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm">Selecione um funcionário</p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  {selectedFuncionario ? 'Histórico Recente (15 dias)' : 'Selecione um funcionário para ver o histórico'}
                </h3>
                {loadingFotos && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
              </div>
              
              {!selectedFuncionario ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/30">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mb-3 mx-auto text-gray-300" />
                    <p>As evidências fotográficas aparecerão aqui</p>
                  </div>
                </div>
              ) : presencas.length > 0 ? (
                <ul className="divide-y divide-gray-100 overflow-y-auto">
                  {presencas.map(p => {
                    const [ano, mes, dia] = p.data.split('-');
                    return (
                      <li key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-4">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-gray-400" /> {dia}/{mes}/{ano}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(p as any).is_atestado ? 'Atestado Médico (Administrador)' : 'Operador Registrou'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(p)}
                              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
                            >
                              Ver Foto
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma presença com evidência fotográfica nos últimos 15 dias.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOTOS */}
      {modalOpen && selectedPresenca && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative z-10 bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-bold text-gray-900 mb-6 border-b pb-4">
                      Auditoria de Presença: {selectedFuncionario?.nome}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Foto de Cadastro</span>
                        <div className="h-64 w-64 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          {registrationPhotoUrl === 'ERROR' ? (
                            <span className="text-red-500 text-sm font-medium flex flex-col items-center p-2 text-center">
                              <User className="h-12 w-12 text-red-300 mb-2 opacity-50" />
                              Foto indisponível
                            </span>
                          ) : registrationPhotoUrl ? (
                            <img src={registrationPhotoUrl} alt="Cadastro" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-24 w-24 text-gray-300" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">
                          {(selectedPresenca as any)?.is_atestado ? "Atestado Médico" : "Foto da Presença"}
                        </span>
                        <div className="h-64 w-64 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          {attendancePhotoUrl === 'EXPIRED' ? (
                            <span className="text-gray-400 text-sm font-medium flex flex-col items-center">
                              <Camera className="h-12 w-12 text-gray-300 mb-2 opacity-50" />
                              Foto Expirada
                              <span className="text-xs text-gray-400 mt-1">(Retenção de 20 dias)</span>
                            </span>
                          ) : attendancePhotoUrl ? (
                            <img src={attendancePhotoUrl} alt="Presença" className="h-full w-full object-cover" />
                          ) : attendancePhotoUrl === 'ERROR' ? (
                              <span className="text-red-500 text-sm font-medium flex flex-col items-center">
                                <Camera className="h-12 w-12 text-red-300 mb-2 opacity-50" />
                                Foto indisponível
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm font-medium flex flex-col items-center">
                                <User className="h-12 w-12 text-gray-300 mb-2" />
                                Sem Foto
                              </span>
                            )}
                        </div>
                        <div className="mt-6 text-center bg-gray-50 p-4 rounded-lg w-full">
                           <p className="text-sm font-medium text-gray-900">
                             Data: {selectedPresenca.data.split('-').reverse().join('/')}
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

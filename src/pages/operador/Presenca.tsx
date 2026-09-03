import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Funcionario } from "../../lib/types";
import { format, parseISO } from "date-fns";
import { compressImage } from "../../lib/imageUtils";
import { useAuth } from "../../contexts/AuthContext";
import { User, Camera, CheckCircle } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function PresencaPage() {
  const { usuario, empresa } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext<any>();
  const isAdmin = usuario?.perfil === "ADMIN";
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [atestadosAtivos, setAtestadosAtivos] = useState<Record<string, any>>(
    {},
  );
  const [presencas, setPresencas] = useState<
    Record<string, boolean | undefined>
  >({});
  const [fullPresencas, setFullPresencas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNaoRegistradosModal, setShowNaoRegistradosModal] = useState(false);
  const [funcionariosNaoRegistrados, setFuncionariosNaoRegistrados] = useState<
    Funcionario[]
  >([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [savedRecords, setSavedRecords] = useState<Record<string, boolean>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [actionMenuFuncId, setActionMenuFuncId] = useState<string | null>(null);
  const [togglingMeiaDiaria, setTogglingMeiaDiaria] = useState(false);

  const handleToggleMeiaDiaria = async (presenca: any) => {
    if (!usuario) return;
    const isMeia = presenca.tipo_diaria === "MEIA_DIARIA";

    try {
      setTogglingMeiaDiaria(true);
      await api.toggleMeiaDiaria(presenca.id, !isMeia, usuario.id);

      // Reload single record or all records
      await loadFuncionariosEPresencas();
      setActionMenuFuncId(null);
      showToast(
        isMeia ? "✅ Revertido para Diária" : "✅ Meia Diária registrada",
        "success",
      );
    } catch (err: any) {
      setErro(err.message || "Erro ao alterar diária");
    } finally {
      setTogglingMeiaDiaria(false);
    }
  };
  const [funcToDelete, setFuncToDelete] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [erro, setErro] = useState("");

  const [cameraModalFuncId, setCameraModalFuncId] = useState<string | null>(
    null,
  );
  const [previewPhoto, setPreviewPhoto] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [capturedFotos, setCapturedFotos] = useState<Record<string, File>>({});
  const [employeeRegistrationPhoto, setEmployeeRegistrationPhoto] =
    useState<string>("");

  const [jaRegistradoHoje, setJaRegistradoHoje] = useState(false);
  const [temRegistros, setTemRegistros] = useState(false);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(hoje);

  useEffect(() => {
    loadFuncionariosEPresencas();
  }, [selectedDate]);

  async function loadFuncionariosEPresencas() {
    setLoading(true);
    setSavedSuccess(false);
    setErro("");

    let funcsRaw: Funcionario[] = [];
    let funcs: Funcionario[] = [];
    let presencasData: any[] = [];
    try {
      funcsRaw = await api.getFuncionarios("todos");
      presencasData = await api.getPresencas(selectedDate);
      
      const presencasIds = new Set(presencasData.map((p) => p.funcionario_id));
      
      funcs = funcsRaw.filter(f => {
        if (presencasIds.has(f.id)) return true;
        
        if (f.data_admissao && selectedDate < f.data_admissao) return false;
        
        if (!f.ativo) {
            if (f.data_desligamento && selectedDate > f.data_desligamento) return false;
            if (!f.data_desligamento) return false;
        }
        
        return true;
      });
      setFuncionarios(funcs);
    } catch (error) {
      setErro("Ocorreu um erro ao carregar os dados.");
      setLoading(false);
      return;
    }

    try {

      let atestados: any[] = [];
      try {
        atestados = await api.getActiveAtestadosForDate(selectedDate);
      } catch (err) {
        console.error("Erro ao carregar atestados", err);
      }

      const atestadosMap: Record<string, any> = {};
      atestados.forEach((a: any) => (atestadosMap[a.employee_id] = a));
      setAtestadosAtivos(atestadosMap);

      const presencasMap: Record<string, boolean | undefined> = {};
      const newSavedRecords: Record<string, boolean> = {};
      const newFullPresencas: Record<string, any> = {};
      presencasData.forEach((p) => {
        presencasMap[p.funcionario_id] = p.presente;
        newSavedRecords[p.funcionario_id] = true;
        newFullPresencas[p.funcionario_id] = p;
      });

      const ativosEsperados = funcs.filter((f) => !atestadosMap[f.id]);
      let todosIdentificados = true;
      ativosEsperados.forEach((f) => {
        if (presencasMap[f.id] === undefined) {
          todosIdentificados = false;
        }
      });

      if (presencasData.length > 0) {
        setTemRegistros(true);
        if (!isAdmin && todosIdentificados) {
          setJaRegistradoHoje(true);
        } else {
          setJaRegistradoHoje(false);
        }
      } else {
        setJaRegistradoHoje(false);
        setTemRegistros(false);
      }

      setPresencas(presencasMap);
      setSavedRecords(newSavedRecords);
      setFullPresencas(newFullPresencas);

      // Load signed URLs for photos
      const newPhotoUrls: Record<string, string> = {};
      await Promise.all(
        funcs.map(async (f) => {
          if (f.photo_path) {
            try {
              const url = await api.getPhotoUrl(
                "employee-photos",
                f.photo_path,
              );
              newPhotoUrls[f.id] = url;
            } catch (err) {
              console.error(
                `Erro ao carregar foto do funcionario ${f.id}`,
                err,
              );
            }
          }
        }),
      );
      setPhotoUrls(newPhotoUrls);
    } catch (error) {
      console.error("Erro ao carregar presenças", error);
      setErro("Ocorreu um erro ao carregar as presenças.");
      setPresencas({});
      setJaRegistradoHoje(false);
    } finally {
      setLoading(false);
    }
  }

  const togglePresenca = async (
    funcionarioId: string,
    pretendStatus: boolean,
  ) => {
    if (jaRegistradoHoje || saving) return;

    if (isAdmin && savedRecords[funcionarioId]) {
      setActionMenuFuncId(funcionarioId);
      return;
    }

    if (pretendStatus === false) {
      setPresencas((prev) => ({ ...prev, [funcionarioId]: false }));
      setSavedSuccess(false);
      return;
    }

    const isCurrentlyPresent = presencas[funcionarioId];

    if (isCurrentlyPresent === true) {
      setPresencas((prev) => ({ ...prev, [funcionarioId]: false }));
      setSavedSuccess(false);
    } else {
      const f = funcionarios.find((x) => x.id === funcionarioId);
      if (f?.photo_path) {
        try {
          const url = await api.getPhotoUrl("employee-photos", f.photo_path);
          setEmployeeRegistrationPhoto(url);
        } catch (e) {
          setEmployeeRegistrationPhoto("");
        }
      } else {
        setEmployeeRegistrationPhoto("");
      }
      setCameraModalFuncId(funcionarioId);
    }
  };

  const handleActionChangeStatus = async () => {
    if (!actionMenuFuncId) return;
    const isCurrentlyPresent = presencas[actionMenuFuncId];
    const newStatus = isCurrentlyPresent === true ? false : true;

    // Optimistic UI update
    setPresencas((prev) => ({ ...prev, [actionMenuFuncId]: newStatus }));

    // If it's already a saved record, update the backend immediately
    if (isAdmin && savedRecords[actionMenuFuncId]) {
      try {
        setSaving(true);
        const now = new Date().toISOString();
        await api.salvarPresencas([{
            funcionario_id: actionMenuFuncId,
            obra_id: funcionarios.find((f) => f.id === actionMenuFuncId)
              ?.obra_id,
            empresa_id: usuario?.empresa_id,
                            data: selectedDate,
            presente: newStatus,
            photo_taken_at: now,
            photo_taken_by: usuario?.id || null,
          },], usuario?.empresa_id);
      } catch (err: any) {
        // Revert on error
        setPresencas((prev) => ({
          ...prev,
          [actionMenuFuncId]: isCurrentlyPresent,
        }));
        setErro("Erro ao alterar status no servidor.");
        showToast("❌ Erro ao alterar status", "error");
        setSaving(false);
        setActionMenuFuncId(null);
        return;
      } finally {
        setSaving(false);
      }
    }

    setSavedSuccess(false);
    setActionMenuFuncId(null);
    showToast("✅ Status atualizado", "success");
  };

  const handleActionReplacePhoto = async () => {
    if (!actionMenuFuncId) return;
    const f = funcionarios.find((x) => x.id === actionMenuFuncId);
    if (f?.photo_path) {
      try {
        const url = await api.getPhotoUrl("employee-photos", f.photo_path);
        setEmployeeRegistrationPhoto(url);
      } catch (e) {
        setEmployeeRegistrationPhoto("");
      }
    } else {
      setEmployeeRegistrationPhoto("");
    }
    setCameraModalFuncId(actionMenuFuncId);
    setActionMenuFuncId(null);
  };

  const confirmDeleteFunc = async () => {
    if (!funcToDelete) return;
    setSaving(true);
    setErro("");

    try {
      await api.deletePresencaFuncionario(funcToDelete, selectedDate);

      // Update local state
      setSavedRecords((prev) => {
        const next = { ...prev };
        delete next[funcToDelete];
        return next;
      });
      setPresencas((prev) => {
        const next = { ...prev };
        delete next[funcToDelete];
        return next;
      });

      // If no records left, reset temRegistros
      const remainingRecords = Object.keys(savedRecords).filter(
        (k) => k !== funcToDelete && savedRecords[k],
      );
      if (remainingRecords.length === 0) {
        setJaRegistradoHoje(false);
      }
    } catch (error: any) {
      setErro(error.message || "Ocorreu um erro ao deletar a presença.");
    } finally {
      setSaving(false);
      setFuncToDelete(null);
    }
  };

  const handleSalvarClick = () => {
    if (jaRegistradoHoje) return;

    const naoIdentificados = funcionarios.filter(
      (f) => !atestadosAtivos[f.id] && presencas[f.id] === undefined,
    );

    if (naoIdentificados.length > 0) {
      setFuncionariosNaoRegistrados(naoIdentificados);
      setShowNaoRegistradosModal(true);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSalvar = async () => {
    setShowConfirm(false);
    setSaving(true);
    setErro("");
    const uploadedPaths: string[] = [];

    try {
      const now = new Date().toISOString();
      const userId = usuario?.id || null;
      const operationId = Date.now().toString(36);

      const pendingFuncionarios = funcionarios.filter(
        (f) => !atestadosAtivos[f.id] && presencas[f.id] !== undefined
      );

      for (const f of pendingFuncionarios) {
        if (presencas[f.id] === true) {
          if (!isAdmin && !capturedFotos[f.id]) {
            throw new Error(`Falta foto de presença para ${f.nome}`);
          }
        }
      }

      if (!usuario || !usuario.empresa_id) {
        console.error("Contexto de empresa inválido:", { empresa_id: usuario?.empresa_id, id: usuario?.id, perfil: usuario?.perfil });
        throw new Error("Empresa não identificada. Atualize sua sessão e tente novamente.");
      }
      if (usuario.perfil === "CONSULTA") {
        throw new Error("Acesso negado: Usuários com perfil CONSULTA não podem registrar presenças.");
      }

      const registrosToSave = await Promise.all(
        pendingFuncionarios.map(async (f) => {
          let photo_path = undefined;
          let photo_taken_at = undefined;
          let photo_taken_by = undefined;

          if (presencas[f.id] === true && capturedFotos[f.id]) {
            photo_path = await api.uploadAttendancePhoto(
              capturedFotos[f.id],
              f.id,
              operationId
            );
            uploadedPaths.push(photo_path);
            photo_taken_at = now;
            photo_taken_by = userId;
          }

          return {
            funcionario_id: f.id,
            obra_id: f.obra_id,
            empresa_id: usuario?.empresa_id,
                            data: selectedDate,
            presente: presencas[f.id],
            ...(photo_path && { photo_path, photo_taken_at, photo_taken_by }),
          };
        })
      );

      await api.salvarPresencas(registrosToSave, usuario?.empresa_id);

      // Reload actual records from DB after save
      const presencasData = await api.getPresencas(selectedDate);
      const newSavedRecords: Record<string, boolean> = {};
      const newPresencasMap: Record<string, boolean | undefined> = {
        ...presencas,
      };
      const newFullPresencas: Record<string, any> = { ...fullPresencas };
      presencasData.forEach((p) => {
        newPresencasMap[p.funcionario_id] = p.presente;
        newSavedRecords[p.funcionario_id] = true;
        newFullPresencas[p.funcionario_id] = p;
      });

      const missingRecords = registrosToSave.filter(
        (r) => !newSavedRecords[r.funcionario_id]
      );
      if (missingRecords.length > 0) {
        throw new Error("Alguns registros não foram persistidos corretamente. A operação foi abortada.");
      }

      const ativosEsperados = funcionarios.filter(
        (f) => !atestadosAtivos[f.id],
      );
      let todosIdentificados = true;
      ativosEsperados.forEach((f) => {
        if (newPresencasMap[f.id] === undefined) {
          todosIdentificados = false;
        }
      });

      if (presencasData.length > 0) {
        setTemRegistros(true);
        if (!isAdmin && todosIdentificados) {
          setJaRegistradoHoje(true);
        } else {
          setJaRegistradoHoje(false);
        }
      }

      setPresencas(newPresencasMap);
      setSavedRecords(newSavedRecords);
      setFullPresencas(newFullPresencas);

      setSavedSuccess(true);
      // showToast('✅ Presença registrada com sucesso!', 'success');
    } catch (error: any) {
      if (uploadedPaths.length > 0) {
        await api.deleteAttendancePhotos(uploadedPaths).catch(() => {});
      }
      setErro(
        error.message || "Ocorreu um erro ao salvar a lista de presenças.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    try {
      let totalPresentes = 0;
      let totalFaltas = 0;
      let totalFuncionarios = funcionarios.length;

      const presentes: string[] = [];
      const faltas: string[] = [];

      // Ensure consistent sorting for employees
      const sortedFuncionarios = [...funcionarios].sort((a, b) =>
        a.nome.localeCompare(b.nome),
      );

      sortedFuncionarios.forEach((f) => {
        if (presencas[f.id] === true || atestadosAtivos[f.id]) {
          presentes.push(f.nome);
          totalPresentes++;
        } else if (presencas[f.id] === false) {
          faltas.push(f.nome);
          totalFaltas++;
        } else {
          // NAO_REGISTRADO (não entra nas estatísticas do zap de faltas explícitas)
        }
      });

      // Format Date
      const [ano, mes, dia] = selectedDate.split("-");
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
      const dataFormatada = format(dataObj, "dd/MM/yyyy");
      const diasSemana = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
      ];
      const diaSemana = diasSemana[dataObj.getDay()];

      const agora = new Date();
      const horaFormatada = format(agora, "HH:mm");
      const hora = agora.getHours();

      let saudacao = "🌙 Boa noite!";
      if (hora < 12) saudacao = "☀️ Bom dia!";
      else if (hora < 18) saudacao = "🌤 Boa tarde!";

      let message = `${saudacao}\nSegue abaixo o controle de diárias referente ao dia de hoje.\n\n`;
      message += `📋 *${empresa?.nome || "PCEG"} - GESTÃO DE OBRAS*\n📅 *${diaSemana}, ${dataFormatada}*\n══════════════════════════════\n\n`;

      message += `👷 *FUNCIONÁRIOS PRESENTES (${presentes.length})*\n`;
      presentes.forEach((nome) => {
        message += `✅ ${nome}\n`;
      });
      message += `\n══════════════════════════════\n\n`;

      message += `❌ *FUNCIONÁRIOS AUSENTES (${faltas.length})*\n`;
      faltas.forEach((nome) => {
        message += `❌ ${nome}\n`;
      });
      message += `\n══════════════════════════════\n\n`;

      const percPresentes =
        totalFuncionarios > 0
          ? Math.round((totalPresentes / totalFuncionarios) * 100)
          : 0;
      const percFaltas =
        totalFuncionarios > 0
          ? Math.round((totalFaltas / totalFuncionarios) * 100)
          : 0;

      message += `📊 *RESUMO GERAL*\n`;
      message += `👷 Total de Funcionários: ${totalFuncionarios}\n`;
      message += `✅ Presentes: ${totalPresentes} (${percPresentes}%)\n`;
      message += `❌ Faltaram: ${totalFaltas} (${percFaltas}%)\n`;
      message += `══════════════════════════════\n\n`;

      const userName = usuario?.usuario || "Usuário";
      message += `🕒 Registrado às: ${horaFormatada}\n`;
      message += `👤 Operador: ${userName}\n\n`;

      message += `📲 Gerado automaticamente pelo sistema\n*{empresa?.nome || "PCEG"}*`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

      const newWindow = window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer",
      );
      if (!newWindow) {
        setErro(
          "Não foi possível abrir o WhatsApp. Seu dispositivo não suporta compartilhamento via WhatsApp.",
        );
      }
    } catch (err) {
      setErro("Não foi possível abrir o WhatsApp.");
    }
  };

  if (savedSuccess && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Presença concluída com sucesso!
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Todos os funcionários foram conferidos.
        </p>
        <button
          onClick={() => {
            if (context && context.setPresencaHojeConcluida) {
              context.setPresencaHojeConcluida(true);
            }
            navigate("/operador/painel");
          }}
          className="w-full max-w-xs py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md"
        >
          Ir para o Painel
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {erro && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
          {erro}
        </div>
      )}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Lista de Presença
        </h2>
        <p className="text-sm text-gray-500">
          {isAdmin ? (
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
              <label
                htmlFor="date"
                className="text-sm font-medium text-gray-700"
              >
                Data:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          ) : (
            <>
              Data atual: <strong>{format(new Date(), "dd/MM/yyyy")}</strong>
            </>
          )}
        </p>
      </div>

      {!loading && (
        <div className="mb-8">
          {funcionarios.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
              Nenhum funcionário cadastrado.
            </div>
          ) : (
            <div>
              {jaRegistradoHoje && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-sm text-sm font-medium">
                  A presença de hoje já foi concluída e não pode mais ser
                  alterada.
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                {funcionarios.map((f) => {
                  const isPresent = presencas[f.id];
                  const fullRecord = fullPresencas[f.id];
                  const isMeia = fullRecord?.tipo_diaria === "MEIA_DIARIA";

                  const statusBadge =
                    isPresent === true ? (
                      isMeia ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                          🟢 MEIA-DIÁRIA
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                          🟢 PRESENTE
                        </span>
                      )
                    ) : isPresent === false ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 shadow-sm">
                        🔴 FALTOU
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 shadow-sm">
                        ⚪ NÃO REGISTRADO
                      </span>
                    );

                  if (atestadosAtivos[f.id]) {
                    return (
                      <div
                        key={f.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-3.5 sm:p-4 rounded-2xl text-left w-full transition-all border bg-slate-50 border-slate-200 shadow-sm"
                      >
                        <div className="flex items-center w-full">
                          <div className="flex-shrink-0 mr-3.5 h-12 w-12 bg-white rounded-full overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                            <span className="text-xl">🩺</span>
                          </div>
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                                {f.nome}
                              </p>
                              {f.tipo_colaborador === 'CLT' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  CLT
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-xs font-medium text-slate-500 truncate">
                                {f.funcao?.nome || "Função não definida"}
                              </span>
                              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                Atestado:{" "}
                                {format(
                                  parseISO(atestadosAtivos[f.id].start_date),
                                  "dd/MM",
                                )}{" "}
                                -{" "}
                                {format(
                                  parseISO(atestadosAtivos[f.id].end_date),
                                  "dd/MM",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 shadow-sm">
                              🔒 Bloqueado
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={f.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center p-3.5 sm:p-4 rounded-2xl text-left w-full transition-all border ${
                        isPresent === true
                          ? "bg-white border-green-200 shadow-sm"
                          : isPresent === false
                            ? "bg-white border-red-200 shadow-sm"
                            : "bg-white border-slate-200 shadow-sm"
                      } ${!isAdmin && (jaRegistradoHoje || saving) ? "opacity-70" : ""} relative group`}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={`flex-shrink-0 mr-3.5 h-12 w-12 bg-slate-50 rounded-full overflow-hidden border shadow-sm flex items-center justify-center transition-colors ${isPresent === true ? "border-green-200 ring-4 ring-green-50" : "border-slate-200"}`}
                        >
                          {photoUrls[f.id] ? (
                            <img
                              src={photoUrls[f.id]}
                              alt={f.nome}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Failed to load image on Presenca card:",
                                  photoUrls[f.id],
                                );
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden",
                                );
                              }}
                            />
                          ) : null}
                          <User
                            className={`h-6 w-6 text-slate-400 ${photoUrls[f.id] ? "hidden" : ""}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight transition-colors">
                              {f.nome}
                            </p>
                            {f.tipo_colaborador === 'CLT' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                                CLT
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-1 truncate">
                            {f.funcao?.nome || "Função não definida"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {isPresent === undefined ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePresenca(f.id, false);
                                }}
                                disabled={
                                  !isAdmin && (jaRegistradoHoje || saving)
                                }
                                className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 shadow-sm hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                FALTOU
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePresenca(f.id, true);
                                }}
                                disabled={
                                  !isAdmin && (jaRegistradoHoje || saving)
                                }
                                className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                PRESENTE
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => togglePresenca(f.id, !isPresent)}
                              disabled={
                                !isAdmin && (jaRegistradoHoje || saving)
                              }
                              className="cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {statusBadge}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && funcionarios.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:relative sm:bg-transparent sm:border-0 sm:p-0 z-10 flex gap-3">
          <button
            onClick={handleSalvarClick}
            disabled={saving || jaRegistradoHoje}
            className={`flex-1 flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white focus:outline-none transition-colors ${
              savedSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:bg-gray-400"
            }`}
          >
            {saving
              ? "Salvando..."
              : savedSuccess
                ? "Presença Salva!"
                : jaRegistradoHoje
                  ? "Já Registrado"
                  : "Salvar Presença"}
          </button>

          {(jaRegistradoHoje || savedSuccess) && (
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <span>🟢</span>
              <span className="hidden sm:inline ml-2">WhatsApp</span>
            </button>
          )}
        </div>
      )}

      {cameraModalFuncId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Registrar Foto
            </h3>

            {!previewPhoto ? (
              <>
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-700 block mb-2 text-center">
                    Foto Atual
                  </span>
                  <div className="h-32 w-32 mx-auto rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                    {employeeRegistrationPhoto ? (
                      <img
                        src={employeeRegistrationPhoto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <p className="text-center font-bold mt-3 text-lg text-gray-900">
                    {funcionarios.find((f) => f.id === cameraModalFuncId)?.nome}
                  </p>
                </div>
                <label className="flex items-center justify-center w-full cursor-pointer px-4 py-4 bg-gray-900 text-white rounded-2xl text-center font-medium hover:bg-gray-800 transition shadow-md">
                  <Camera className="w-6 h-6 mr-3" />
                  Abrir Câmera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        compressImage(file)
                          .then((compressedFile) => {
                            setPreviewPhoto({
                              file: compressedFile,
                              url: URL.createObjectURL(compressedFile),
                            });
                          })
                          .catch((err) => {
                            console.error("Erro na compressão:", err);
                            setPreviewPhoto({
                              file,
                              url: URL.createObjectURL(file),
                            });
                          });
                      }
                    }}
                  />
                </label>
                {isAdmin && (
                  <button
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        if (isAdmin && savedRecords[cameraModalFuncId]) {
                          const now = new Date().toISOString();
                          await api.salvarPresencas([{
                              funcionario_id: cameraModalFuncId,
                              obra_id: funcionarios.find(
                                (f) => f.id === cameraModalFuncId,
                              )?.obra_id,
                              empresa_id: usuario?.empresa_id,
                            data: selectedDate,
                              presente: true,
                              photo_taken_at: now,
                              photo_taken_by: usuario?.id || null,
                            },], usuario?.empresa_id);
                          showToast(
                            "✅ Presença registrada sem foto!",
                            "success",
                          );
                        } else {
                          setPresencas((prev) => ({
                            ...prev,
                            [cameraModalFuncId]: true,
                          }));
                          setSavedSuccess(false);
                        }

                        setCameraModalFuncId(null);
                        setPreviewPhoto(null);
                      } catch (err: any) {
                        setErro(err.message || "Erro ao processar");
                        showToast("❌ Erro ao processar", "error");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="mt-4 w-full px-4 py-4 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition shadow-sm"
                  >
                    Registrar Sem Foto
                  </button>
                )}
                <button
                  onClick={() => {
                    setCameraModalFuncId(null);
                    setPreviewPhoto(null);
                  }}
                  className="mt-4 w-full px-4 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-700 block mb-2 text-center">
                    Nova Foto
                  </span>
                  <div className="h-48 w-48 mx-auto rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                    <img
                      src={previewPhoto.url}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    let uploadedPhotoPath = null;

                    try {
                      // If it's a replacement (already saved), update immediately
                      if (isAdmin && savedRecords[cameraModalFuncId]) {
                        const now = new Date().toISOString();
                        const photo_path = await api.uploadAttendancePhoto(
                          previewPhoto.file,
                          cameraModalFuncId,
                          Date.now().toString(36)
                        );
                        uploadedPhotoPath = photo_path;
                        await api.salvarPresencas([{
                            funcionario_id: cameraModalFuncId,
                            obra_id: funcionarios.find(
                              (f) => f.id === cameraModalFuncId,
                            )?.obra_id,
                            empresa_id: usuario?.empresa_id,
                            data: selectedDate,
                            presente: true,
                            photo_path,
                            photo_taken_at: now,
                            photo_taken_by: usuario?.id || null,
                          },], usuario?.empresa_id);
                        showToast(
                          "✅ Foto substituída com sucesso!",
                          "success",
                        );
                      } else {
                        // Standard flow: just save to state for bulk submission
                        setCapturedFotos((prev) => ({
                          ...prev,
                          [cameraModalFuncId]: previewPhoto.file,
                        }));
                        setPresencas((prev) => ({
                          ...prev,
                          [cameraModalFuncId]: true,
                        }));
                        setSavedSuccess(false);
                      }
                      setCameraModalFuncId(null);
                      setPreviewPhoto(null);
                    } catch (err: any) {
                      if (uploadedPhotoPath) {
                        await api.deleteAttendancePhotos([uploadedPhotoPath]).catch(() => {});
                      }
                      setErro(err.message || "Erro ao processar foto");
                      showToast("❌ Erro ao processar foto", "error");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="flex justify-center items-center w-full px-4 py-4 bg-green-600 text-white rounded-2xl text-center font-medium hover:bg-green-700 transition shadow-md disabled:opacity-70"
                >
                  {saving ? "Salvando..." : "Confirmar e Salvar"}
                </button>
                <button
                  disabled={saving}
                  onClick={() => setPreviewPhoto(null)}
                  className="mt-4 w-full px-4 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition"
                >
                  Tirar Outra Foto
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {actionMenuFuncId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Ações de Presença
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {funcionarios.find((f) => f.id === actionMenuFuncId)?.nome}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleActionChangeStatus}
                className="w-full px-4 py-4 font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors flex items-center gap-4 text-left"
              >
                <span className="text-2xl">🔄</span>{" "}
                <span className="font-medium text-lg">Alterar Status</span>
              </button>

              {isAdmin &&
                presencas[actionMenuFuncId] === true &&
                funcionarios.find((f) => f.id === actionMenuFuncId)
                  ?.tipo_colaborador === "DIARISTA" &&
                fullPresencas[actionMenuFuncId] && (
                  <button
                    onClick={() =>
                      handleToggleMeiaDiaria(fullPresencas[actionMenuFuncId])
                    }
                    disabled={togglingMeiaDiaria}
                    className={`w-full px-4 py-4 font-medium rounded-2xl transition-colors flex items-center gap-4 text-left disabled:opacity-50 ${fullPresencas[actionMenuFuncId].tipo_diaria === "MEIA_DIARIA" ? "text-amber-700 bg-amber-50 hover:bg-amber-100" : "text-gray-700 bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <span className="text-2xl">
                      {fullPresencas[actionMenuFuncId].tipo_diaria ===
                      "MEIA_DIARIA"
                        ? "↩️"
                        : "💰"}
                    </span>
                    <span className="font-medium text-lg">
                      {fullPresencas[actionMenuFuncId].tipo_diaria ===
                      "MEIA_DIARIA"
                        ? "Reverter para Diária"
                        : "Meia Diária"}
                    </span>
                  </button>
                )}

              <button
                onClick={handleActionReplacePhoto}
                className="w-full px-4 py-4 font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors flex items-center gap-4 text-left"
              >
                <span className="text-2xl">📸</span>{" "}
                <span className="font-medium text-lg">Substituir Foto</span>
              </button>
              <button
                onClick={() => {
                  setFuncToDelete(actionMenuFuncId);
                  setActionMenuFuncId(null);
                }}
                className="w-full px-4 py-4 font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors flex items-center gap-4 text-left"
              >
                <span className="text-2xl">🗑️</span>{" "}
                <span className="font-medium text-lg">Excluir Presença</span>
              </button>
            </div>
            <button
              onClick={() => setActionMenuFuncId(null)}
              className="mt-6 w-full px-4 py-4 text-lg font-medium text-gray-600 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {funcToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center text-red-600">
              Excluir Presença
            </h3>
            <p className="text-gray-600 mb-6 text-center text-lg">
              Are you sure you want to delete this attendance record for{" "}
              <strong>
                {funcionarios.find((f) => f.id === funcToDelete)?.nome}
              </strong>
              ?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setFuncToDelete(null)}
                className="w-full sm:w-auto px-6 py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFunc}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 order-1 sm:order-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Confirmar
            </h3>
            <p className="text-gray-600 mb-6 text-center text-lg">
              Deseja salvar a lista de presença?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full sm:w-auto px-6 py-3 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSalvar}
                className="w-full sm:w-auto px-6 py-3 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors order-1 sm:order-2"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNaoRegistradosModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center text-red-600">
              Atenção
            </h3>
            <p className="text-gray-600 mb-4 text-center text-lg">
              {funcionariosNaoRegistrados.length === 1
                ? `Você não identificou se ${funcionariosNaoRegistrados[0].nome} está presente.`
                : "Você não identificou se os seguintes funcionários estão presentes:"}
            </p>
            {funcionariosNaoRegistrados.length > 1 && (
              <ul className="mb-6 text-gray-700 text-left list-disc pl-5 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
                {funcionariosNaoRegistrados.map((f) => (
                  <li key={f.id} className="mb-1">
                    {f.nome}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-gray-500 mb-6 text-center text-sm">
              Por favor, registre PRESENTE ou FALTOU para todos antes de
              finalizar a diária.
            </p>
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setShowNaoRegistradosModal(false)}
                className="w-full px-6 py-3 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-gray-900 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

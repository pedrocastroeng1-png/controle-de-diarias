import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

import { Usuario, Obra, Funcao, Funcionario, Presenca, AtestadoMedico } from './types';

export const api = {

  // Communications
  getCommunications: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communications')
      .select('*, creator:usuarios!created_by(id, usuario), target_operator:usuarios!target_operator_id(id, usuario)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getUnreadCommunications: async (operatorId: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Get all active communications
    const { data: comms, error: commsError } = await supabase
      .from('communications')
      .select('*, creator:usuarios!created_by(id, usuario), attachments:communication_attachments(*)')
      .eq('is_active', true);
      
    if (commsError) throw commsError;

    // Get all recipient records for this operator
    const commIds = (comms || []).map(c => c.id);
    let reads: any[] = [];
    if (commIds.length > 0) {
      const { data, error: readsError } = await supabase
        .from('communication_recipients')
        .select('communication_id, read_at')
        .eq('operator_id', operatorId)
        .in('communication_id', commIds);
      if (readsError) throw readsError;
      reads = data || [];
    }

    const recipientRecords = new Map(reads.map(r => [r.communication_id, r]));
    
    const validComms = (comms || []).filter(c => {
      // Check expiration
      if (c.expiration_date && c.expiration_date < today) return false;
      
      const rec = recipientRecords.get(c.id);
      
      // Check audience
      if (c.target_audience === 'OPERATOR') {
        // Must be explicitly targeted via target_operator_id or recipient table
        if (c.target_operator_id !== operatorId && !rec) return false;
      }
      
      // Check if read
      if (rec && rec.read_at) return false; // Already read
      
      return true;
    });
    
    return validComms.sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  
  getCommunicationRecipients: async (communicationId: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communication_recipients')
      .select('*, operator:usuarios!operator_id(id, usuario)')
      .eq('communication_id', communicationId)
      .order('read_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  
  markCommunicationRead: async (communicationId: string, operatorId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase
      .from('communication_recipients')
      .upsert({
        communication_id: communicationId,
        operator_id: operatorId,
        read_at: new Date().toISOString()
      }, { onConflict: 'communication_id, operator_id' });
    if (error) throw error;
  },

  
  createCommunicationAttachment: async (payload: any): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communication_attachments')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  
  createCommunicationRecipient: async (communication_id: string, operator_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    await supabase.from('communication_recipients').insert([{ communication_id, operator_id }]);
  },
  createCommunication: async (payload: any): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communications')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCommunication: async (id: string, payload: any): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communications')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCommunication: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase
      .from('communications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  markCommunicationAsRead: async (communicationId: string, operatorId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase
      .from('communication_recipients')
      .insert([{ communication_id: communicationId, operator_id: operatorId }]);
    if (error) throw error;
  },

  getOperators: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario')
      .eq('perfil', 'OPERADOR')
      .eq('ativo', true);
    if (error) throw error;
    return data || [];
  },

  // Usuarios

checkUserActive: async (id: string): Promise<{ data: any | null, error: any | null }> => {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, perfil, ativo')
      .eq('id', id)
      .single();
    return { data, error };
  },

  login: async (usuario: string, senha: string): Promise<Usuario | null> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, perfil, senha')
      .eq('usuario', usuario)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      throw new Error('Usuário ou senha inválidos.');
    }

    const { senha: passwordHash, ...userData } = data;
    
    let isValid = false;
    if (passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$'))) {
      isValid = await bcrypt.compare(senha, passwordHash);
    } else {
      isValid = senha === passwordHash;
    }

    if (!isValid) {
      throw new Error('Usuário ou senha inválidos.');
    }

    return userData;
  },

  // Obras
  getObras: async (): Promise<Obra[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('obras').select('*').eq('ativo', true).order('nome');
    if (error) throw error;
    return data;
  },
  createObra: async (obra: Omit<Obra, 'id'>): Promise<Obra> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('obras').insert([obra]).select().single();
    if (error) throw error;
    return data;
  },
  updateObra: async (id: string, obra: Partial<Obra>): Promise<Obra> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('obras').update(obra).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteObra: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.from('obras').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },

  // Funcoes
  getFuncoes: async (): Promise<Funcao[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('funcoes').select('*').eq('ativo', true).order('nome');
    if (error) throw error;
    return data;
  },
  createFuncao: async (funcao: Omit<Funcao, 'id'>): Promise<Funcao> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('funcoes').insert([funcao]).select().single();
    if (error) throw error;
    return data;
  },
  updateFuncao: async (id: string, funcao: Partial<Funcao>): Promise<Funcao> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('funcoes').update(funcao).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteFuncao: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.from('funcoes').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },

  // Funcionarios
  getFuncionarios: async (status: 'ativos' | 'inativos' | 'todos' = 'ativos', apenasDiaristas = false): Promise<Funcionario[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('funcionarios')
      .select(`*, funcao:funcoes(*), obra:obras(*)`)
      .order('nome');

    if (status === 'ativos') {
      query = query.eq('ativo', true);
    } else if (status === 'inativos') {
      query = query.eq('ativo', false);
    }
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }

    
    let { data, error } = await query;
    if (data) {
       // Since vw_relatorio_presencas might not have tipo_colaborador or inner join properly mapped
       // Let's filter out CLT using getFuncionarios
       const { data: cltData } = await supabase.from('funcionarios').select('nome').eq('tipo_colaborador', 'CLT');
       const cltNames = cltData?.map(f => f.nome) || [];
       data = data.filter(r => !cltNames.includes(r.funcionario));
    }
    if (error) throw error;
    return data as any;
  },
  createFuncionario: async (funcionario: Omit<Funcionario, 'id' | 'funcao' | 'obra'>): Promise<Funcionario> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('funcionarios').insert([funcionario]).select().single();
    if (error) throw error;
    return data as any;
  },
  updateFuncionario: async (id: string, funcionario: Partial<Funcionario>): Promise<Funcionario> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.from('funcionarios').update(funcionario).eq('id', id).select().single();
    if (error) throw error;
    return data as any;
  },
  deleteFuncionario: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.from('funcionarios').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },
  getFuncionariosPorObra: async (obra_id: string, apenasDiaristas = false): Promise<Funcionario[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('funcionarios')
      .select(`*, funcao:funcoes(*), obra:obras(*)`)
      .eq('obra_id', obra_id)
      .eq('ativo', true);
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }
    query = query.order('nome');
    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  },

  // Presencas
  getPresencas: async (data: string, obra_id?: string): Promise<Presenca[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('presencas')
      .select(`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))`)
      .or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null', { referencedTable: 'funcionarios' })
      .eq('data', data);
      
    if (obra_id) {
      query = query.eq('obra_id', obra_id);
    }
    
    const { data: presencas, error } = await query;
    if (error) throw error;
    return presencas as any;
  },
  
  toggleMeiaDiaria: async (presenca_id: string, is_meia: boolean, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    try {
      if (is_meia) {
        const { error } = await supabase.rpc('definir_meia_diaria', {
          p_presenca_id: presenca_id,
          p_usuario_id: usuario_id
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('reverter_meia_diaria', {
          p_presenca_id: presenca_id,
          p_usuario_id: usuario_id
        });
        if (error) throw error;
      }
    } catch (e: any) {
        throw e;
    }
  },

  deletePresencaFuncionario: async (funcionario_id: string, data: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.from('presencas').delete().eq('funcionario_id', funcionario_id).eq('data', data);
    if (error) throw error;
  },

  salvarPresencas: async (presencas: Array<any>): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    if (!presencas || presencas.length === 0) return;
    
    const { data, error } = await supabase
      .from('presencas')
      .upsert(presencas, { onConflict: 'funcionario_id,data' })
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('A operação falhou silenciosamente: nenhum registro foi salvo. Verifique as permissões de acesso ou restrições do banco de dados.');
    }
  },

  getRelatorio: async (dataInicial?: string, dataFinal?: string, obraId?: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('vw_relatorio_presencas')
      .select('*')
      .order('data', { ascending: false });

    if (dataInicial) {
      query = query.gte('data', dataInicial);
    }
    if (dataFinal) {
      query = query.lte('data', dataFinal);
    }
    if (obraId) {
      // Obras are filtered by name since the view has 'obra' column
      query = query.eq('obra', obraId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data as any;
  },

  // Storage
  
  uploadPhoto: async (bucket: string, file: File | Blob, prefix: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const ext = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = `${prefix}_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    
    if (error) {
       console.error("Storage upload error:", error);
       throw error;
    }
    return data.path;
  },

  uploadEmployeePhoto: async (file: File, employeeId: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('employee-photos')
      .upload(fileName, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

    if (error) {
       console.error("Storage upload error:", error);
       throw error;
    }
    return data.path;
  },

  uploadFerramentaPhoto: async (file: File, ferramentaId: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const fileExt = file.name.split('.').pop();
    const fileName = `${ferramentaId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('fotos_ferramentas')
      .upload(fileName, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

    if (error) {
       console.error("Storage upload error:", error);
       throw error;
    }
    return data.path;
  },

  uploadAttendancePhoto: async (file: Blob, employeeId: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${employeeId}_${timestamp}.jpg`;
    const { data, error } = await supabase.storage
      .from('attendance-photos')
      .upload(fileName, file, { contentType: 'image/jpeg' });

    if (error) throw error;
    return data.path;
  },

  getPhotoUrl: async (bucket: 'employee-photos' | 'attendance-photos' | 'medical-certificates' | 'fotos_ferramentas', path: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  },

  // Auditoria
  getAuditoriaPresencas: async (funcionario_id: string): Promise<Presenca[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // Get presences from last 15 days with photo
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
    const dataLimite = quinzeDiasAtras.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('presencas')
      .select(`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))`)
      .eq('funcionario_id', funcionario_id)
      .not('photo_path', 'is', null)
      .gte('data', dataLimite)
      .order('data', { ascending: false });

    if (error) throw error;
    return data as any;
  },


  getDashboardStats: async (hoje: string) => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { count: obrasCount } = await supabase.from('obras').select('*', { count: 'exact', head: true }).eq('ativo', true);
    const { count: funcionariosCount } = await supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('ativo', true).or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    
        const { data: presencasHojeData, error } = await supabase.from('presencas').select('presente, tipo_diaria, percentual_diaria, funcionario:funcionarios!inner(tipo_colaborador, funcao:funcoes(valor_diaria))').eq('data', hoje).or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null', { referencedTable: 'funcionarios' });
    if (error) throw error;
    let presentesHoje = 0;
    let faltasHoje = 0;
    let valorTotalHoje = 0;
    presencasHojeData?.forEach(p => {
      if (p.presente) {
        presentesHoje++;
        let valor = Number((p.funcionario as any)?.funcao?.valor_diaria || 0);
        if (p.tipo_diaria === 'MEIA_DIARIA') valor = valor / 2;
        valorTotalHoje += valor;
      } else {
        faltasHoje++;
      }
    });


    // Communication stats
    const { data: communications } = await supabase.from('communications').select('id, target_audience, target_operator_id');
    const { data: recipients } = await supabase.from('communication_recipients').select('communication_id, operator_id, read_at');
    const { data: operators } = await supabase.from('usuarios').select('id').eq('perfil', 'OPERADOR');
    
    let totalComms = communications?.length || 0;
    let readComms = recipients?.filter(r => r.read_at)?.length || 0;
    let totalExpectedReads = 0;
    
    const numOperators = operators?.length || 0;
    
    if (communications) {
      communications.forEach(c => {
        if (c.target_audience === 'ALL') {
          totalExpectedReads += numOperators;
        } else {
          totalExpectedReads += 1;
        }
      });
    }
    
    const unreadComms = totalExpectedReads - readComms;

    return {
      totalObras: obrasCount || 0,
      totalFuncionarios: funcionariosCount || 0,
      presentesHoje,
      faltasHoje,
      valorTotalHoje,
      totalComms,
      readComms,
      unreadComms
    };
  },

  // Atestados
  getAtestados: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('medical_certificates')
      .select('*, funcionario:funcionarios(*)');
    if (error) throw error;
    return data;
  },
  
  createAtestado: async (atestado: any): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('medical_certificates')
      .insert([atestado])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  updateAtestado: async (id: string, atestado: any): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('medical_certificates')
      .update(atestado)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  deleteAtestado: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase
      .from('medical_certificates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  
  getActiveAtestadosForDate: async (dateStr: string): Promise<any[]> => {
    // dateStr format: YYYY-MM-DD
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('medical_certificates')
      .select('*, funcionario:funcionarios(*)')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr);
    if (error) throw error;
    return data || [];
  },


  // Ferramentas
  getFerramentas: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('ferramentas')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  getFerramenta: async (id: string): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('ferramentas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  createFerramenta: async (ferramenta: any, usuario_id: string): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('ferramentas')
      .insert([{ ...ferramenta, created_by: usuario_id }])
      .select()
      .single();
    if (error) throw error;
    
    await supabase.from('historico_ferramentas').insert([{
      ferramenta_id: data.id,
      evento: 'CADASTRO',
      usuario_id,
      descricao: 'Ferramenta cadastrada no sistema'
    }]);
    
    return data;
  },
  updateFerramenta: async (id: string, ferramenta: any, usuario_id: string): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('ferramentas')
      .update(ferramenta)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    await supabase.from('historico_ferramentas').insert([{
      ferramenta_id: id,
      evento: 'EDICAO',
      usuario_id,
      descricao: 'Ferramenta editada'
    }]);
    
    return data;
  },
  inativarFerramenta: async (id: string, observacao: string | undefined, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'INATIVA' }).eq('id', id);
    if (updError) throw updError;

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id: id,
      evento: 'INATIVACAO',
      usuario_id,
      descricao: `Marcada como inativa` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },
  reativarFerramenta: async (id: string, observacao: string | undefined, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'ATIVA' }).eq('id', id);
    if (updError) throw updError;

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id: id,
      evento: 'REATIVACAO',
      usuario_id,
      descricao: `Reativada` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },
  getEmprestimosFerramentas: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('emprestimos_ferramentas')
      .select('*, ferramenta:ferramentas(*), funcionario:funcionarios(*, funcao:funcoes(*)), obra:obras(*)')
      .order('data_emprestimo', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  
  getTodosEmprestimos: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('emprestimos_ferramentas')
      .select('*, ferramenta:ferramentas(nome, codigo_interno), funcionario:funcionarios(nome), obra:obras(nome)')
      .order('data_emprestimo', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  getEmprestimosAtivos: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('emprestimos_ferramentas')
      .select('*, ferramenta:ferramentas(*), funcionario:funcionarios(*), obra:obras(*)')
      .is('data_devolucao', null)
      .order('data_emprestimo', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  getHistoricoFerramentas: async (ferramentaId?: string): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('historico_ferramentas')
      .select('*, ferramenta:ferramentas(*), usuario:usuarios(*)');
    if (ferramentaId) {
      query = query.eq('ferramenta_id', ferramentaId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  
  // RPC Calls for Ferramentas
  emprestarFerramenta: async (ferramenta_id: string, funcionario_id: string, obra_id: string, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data: emprestimo, error: empError } = await supabase.from('emprestimos_ferramentas').insert([{
      ferramenta_id,
      funcionario_id,
      obra_id,
      operador_emprestimo_id: usuario_id,
      data_emprestimo: new Date().toISOString()
    }]).select().single();
    if (empError) throw empError;

    const { error: updError } = await supabase.from('ferramentas').update({ status: 'EMPRESTADA' }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { data: funcData } = await supabase.from('funcionarios').select('nome').eq('id', funcionario_id).single();
    const { data: obraData } = await supabase.from('obras').select('nome').eq('id', obra_id).single();
    const { data: ferData } = await supabase.from('ferramentas').select('nome, codigo_interno').eq('id', ferramenta_id).single();
    
    const funcNome = funcData?.nome || funcionario_id;
    const obraNome = obraData?.nome || obra_id;
    const ferNome = ferData ? `${ferData.nome} ${ferData.codigo_interno}` : 'Ferramenta';

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'EMPRESTIMO',
      usuario_id,
      descricao: `${ferNome} Emprestada para ${funcNome} Obra ${obraNome}`
    }]);
    if (histError) throw histError;
  },

  devolverFerramenta: async (emprestimo_id: string, condicao: string, observacao: string | undefined, usuario_id: string, ferramenta_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    const { data: emprestimo } = await supabase
      .from('emprestimos_ferramentas')
      .select('funcionario_id, obra_id, funcionario:funcionarios(nome), obra:obras(nome)')
      .eq('id', emprestimo_id)
      .single();
      
    const funcNome = (emprestimo?.funcionario as any)?.nome || emprestimo?.funcionario_id || 'funcionário';
    const obraNome = (emprestimo?.obra as any)?.nome || emprestimo?.obra_id || 'obra';

    const { error: empError } = await supabase.from('emprestimos_ferramentas').update({
      data_devolucao: new Date().toISOString(),
      operador_devolucao_id: usuario_id,
      condicao_devolucao: condicao,
      observacao_devolucao: observacao || null
    }).eq('id', emprestimo_id);
    if (empError) throw empError;

    const { error: updError } = await supabase.from('ferramentas').update({ status: 'ATIVA' }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { data: ferData } = await supabase.from('ferramentas').select('nome, codigo_interno').eq('id', ferramenta_id).single();
    const ferNome = ferData ? `${ferData.nome} ${ferData.codigo_interno}` : 'Ferramenta';

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'DEVOLUCAO',
      usuario_id,
      descricao: `${ferNome} Devolvida por ${funcNome} da obra ${obraNome} em condição: ${condicao}` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },

  marcarReparoFerramenta: async (ferramenta_id: string, observacao: string | undefined, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'EM_REPARO', ultima_manutencao: new Date().toISOString() }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'REPARO',
      usuario_id,
      descricao: `Enviada para reparo` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },

  finalizarReparoFerramenta: async (ferramenta_id: string, observacao: string | undefined, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'ATIVA', ultima_manutencao: new Date().toISOString() }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'REPARO',
      usuario_id,
      descricao: `Retorno de reparo` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },

  
  marcarQuebradaFerramenta: async (ferramenta_id: string, observacao: string, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'QUEBRADA' }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { data: fData } = await supabase.from('ferramentas').select('nome, codigo_interno').eq('id', ferramenta_id).single();
    const fNome = fData ? `${fData.nome} ${fData.codigo_interno}` : 'Ferramenta';

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'QUEBRA',
      usuario_id,
      descricao: `${fNome} marcada como QUEBRADA` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  },

  // Central de Comunicações
  getCentralSugestoes: async (): Promise<any[]> => {
    return []; // Disabled because central_sugestoes table does not exist in production yet
  },

  getCentralComunicacoes: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        remetente:usuarios!created_by(id, usuario),
        destinatarios:communication_recipients(id, read_at, confirmed, usuario:usuarios!operator_id(id, usuario))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log("communications table missing or error", error);
      return [];
    }
    return data.map((item: any) => ({
      id: item.id,
      titulo: item.title,
      mensagem: item.message,
      data_envio: item.created_at,
      created_at: item.created_at,
      remetente: item.remetente,
      destinatarios: item.destinatarios ? item.destinatarios.map((d: any) => ({
        id: d.id,
        lida: d.read_at !== null,
        data_leitura: d.read_at,
        usuario: d.usuario
      })) : []
    }));
  },

  sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id, usuario_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string, usuario_id?: string }): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // In a real scenario we'd do a transaction, here we insert and map
    const { data: comm, error } = await supabase
      .from('communications')
      .insert([{ 
        title: titulo, 
        message: mensagem,
        type: 'INFO',
        priority: 'NORMAL',
        target_audience: 'OPERATOR',
        created_by: usuario_id || null
      }])
      .select('id')
      .single();
      
    if (error) throw error;
    
    if (destinatarios && destinatarios.length > 0) {
       const dests = destinatarios.map(d => ({
          communication_id: comm.id,
          operator_id: d
       }));
       await supabase.from('communication_recipients').insert(dests);
    }
    
    if (usuario_id) {
       const { error: rpcError } = await supabase.rpc('request_communication_push', {
         p_communication_id: comm.id,
         p_usuario_id: usuario_id
       });
       if (rpcError) {
         console.error("RPC Push error:", rpcError);
         throw new Error('Comunicação salva, mas falha ao despachar notificação Push.');
       }
    }
    
    if (sugestao_id) {
       // Table does not exist in production yet
    }
  },
  

  getUnreadCentralCommunications: async (usuario_id: string): Promise<any[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('communication_recipients')
        .select('*, comunicacao:communications(*)')
        .eq('operator_id', usuario_id)
        .is('read_at', null);
      if (error) return [];
      return data.map((item: any) => ({
        id: item.id,
        lida: item.read_at !== null,
        data_leitura: item.read_at,
        comunicacao: {
           id: item.comunicacao.id,
           titulo: item.comunicacao.title,
           mensagem: item.comunicacao.message,
           data_envio: item.comunicacao.created_at,
           created_at: item.comunicacao.created_at
        }
      }));
    } catch (e) {
      return [];
    }
  },

  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('communication_recipients').update({ read_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  },
  registerPushDevice: async (usuario_id: string, token: string, plataforma: string): Promise<void> => {
    if (!supabase) return;
    try {
      const { data: existing } = await supabase.from('push_devices').select('id').eq('token', token).maybeSingle();
      const payload = {
        usuario_id,
        token,
        plataforma: plataforma.toUpperCase(),
        ativo: true,
        ultimo_uso_at: new Date().toISOString()
      };
      if (existing) {
        await supabase.from('push_devices').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('push_devices').insert([payload]);
      }
    } catch (e) {
      console.error('Error registering push device:', e);
    }
  },
  
  deactivatePushDevice: async (token: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('push_devices').update({ ativo: false }).eq('token', token);
    } catch (e) {
      console.error('Error deactivating push device:', e);
    }
  },
marcarPerdidaFerramenta: async (ferramenta_id: string, observacao: string | undefined, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error: updError } = await supabase.from('ferramentas').update({ status: 'PERDIDA' }).eq('id', ferramenta_id);
    if (updError) throw updError;

    const { error: histError } = await supabase.from('historico_ferramentas').insert([{
      ferramenta_id,
      evento: 'PERDA',
      usuario_id,
      descricao: `Marcada como perdida` + (observacao ? ` - ${observacao}` : '')
    }]);
    if (histError) throw histError;
  }
};
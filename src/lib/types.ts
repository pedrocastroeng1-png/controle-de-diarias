export type Perfil = 'ADMIN' | 'OPERADOR' | 'CONSULTA';

export interface Usuario {
  id: string;
  usuario: string;
  senha?: string;
  perfil: Perfil;
}

export interface Obra {
  id: string;
  nome: string;
}

export interface Funcao {
  id: string;
  nome: string;
  valor_diaria: number;
}

export interface Funcionario {
  id: string;
  nome: string;
  funcao_id: string;
  obra_id: string;
  tipo_colaborador?: "DIARISTA" | "CLT";
  ativo?: boolean;
  photo_path?: string | null;
  forma_pagamento?: "CAIXA ECONOMICA FEDERAL" | "PIX" | null;
  agencia?: string | null;
  tipo_conta?: "CONTA CORRENTE" | "CONTA POUPANÇA" | null;
  conta?: string | null;
  chave_pix?: string | null;
  observacao_pagamento?: string | null;
  funcao?: Funcao;
  obra?: Obra;
}

export interface Presenca {
  id: string;
  funcionario_id: string;
  obra_id: string;
  tipo_colaborador?: "DIARISTA" | "CLT";
  data: string;
  presente: boolean;
  tipo_diaria?: string;
  photo_path?: string | null;
  photo_taken_at?: string;
  photo_taken_by?: string;

  funcionario?: Funcionario;
}

export interface AtestadoMedico {
  id: string;
  employee_id: string;
  start_date: string;
  days: number;
  end_date: string;
  description?: string;
  photo_path?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  funcionario?: Funcionario;
}

export interface RelatorioPresenca {
  id: string;
  data: string;
  status: string;
  funcionario: string;
  funcao: string;
  valor_diaria: number;
  tipo_diaria: string;
  percentual_diaria: number;
  valor_calculado: number;
  obra: string;
}


export type TargetAudience = 'ALL' | 'OPERATOR';
export type Priority = 'NORMAL' | 'URGENT';
export type CommunicationType = 'INFO' | 'ATTENTION' | 'URGENT' | 'EMPLOYEE' | 'WORKSITE' | 'MATERIAL' | 'MEDICAL_CERTIFICATE';

export interface Communication {
  id: string;
  title: string;
  message: string;
  type: CommunicationType;
  priority: Priority;
  expiration_date?: string;
  target_audience: TargetAudience;
  target_operator_id?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator?: Usuario;
  target_operator?: Usuario;
  attachments?: CommunicationAttachment[];
}

export interface CommunicationRecipient {
  id: string;
  communication_id: string;
  operator_id: string;
  read_at: string;
  operator?: Usuario;
}

export interface CommunicationAttachment {
  id: string;
  communication_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}
export type ToolStatus = 'ATIVA' | 'EMPRESTADA' | 'QUEBRADA' | 'EM_REPARO' | 'PERDIDA' | 'INATIVA';
export type ToolEventType = 'CADASTRO' | 'EDICAO' | 'EMPRESTIMO' | 'DEVOLUCAO' | 'QUEBRA' | 'REPARO' | 'PERDA' | 'INATIVACAO' | 'REATIVACAO';
export type ReturnCondition = 'PERFEITO_ESTADO' | 'DANIFICADA';

export interface Ferramenta {
  id: string;
  codigo_interno: string;
  nome: string;
  marca?: string;
  modelo?: string;
  foto_path?: string | null;
  status: ToolStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmprestimoFerramenta {
  id: string;
  ferramenta_id: string;
  funcionario_id: string;
  obra_id: string;
  tipo_colaborador?: "DIARISTA" | "CLT";
  operador_emprestimo_id: string;
  data_emprestimo: string;
  data_devolucao?: string;
  operador_devolucao_id?: string;
  condicao_devolucao?: ReturnCondition;
  observacao_devolucao?: string;
  ferramenta?: Ferramenta;
  funcionario?: Funcionario;
  obra?: Obra;
}

export interface HistoricoFerramenta {
  id: string;
  ferramenta_id: string;
  evento: ToolEventType;
  usuario_id: string;
  descricao?: string;
  created_at: string;
  usuario?: Usuario;
  ferramenta?: Ferramenta;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  kind: 'PROGRAMADA' | 'CONDICIONAL' | 'EVENTO';
  module: string;
  trigger_code?: string;
  days_of_week?: string[];
  schedule_time?: string;
  timezone?: string;
  recipients?: string[];
  channels?: string[];
  title_template?: string;
  message_template: string;
  condition?: any;
  priority?: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationEventCatalog {
  id: string;
  module: string;
  event_code: string;
  label: string;
  description?: string;
  supports_conditions: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationRun {
  id: string;
  rule_id: string;
  status: 'EXECUTADA' | 'PARCIAL' | 'FALHOU' | 'IGNORADA';
  recipients?: string[];
  message_id?: string;
  error_message?: string;
  created_at?: string;
  rule?: AutomationRule;
}


export interface MaterialCategory {
  id: string;
  nome: string;
  descricao?: string;
  is_epi?: boolean;
  created_at?: string;
}

export interface Material {
  id: string;
  category_id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  is_epi?: boolean;
  created_at?: string;
  
  category?: MaterialCategory;
}

export interface CompraMaterial {
  id: string;
  obra_id: string;
  fornecedor?: string;
  numero_recibo?: string;
  observacao?: string;
  total: number;
  data_compra: string;
  registrado_por: string;
  created_at?: string;
  
  obra?: Obra;
  registrador?: { usuario: string };
  itens?: CompraMaterialItem[];
}

export interface CompraMaterialItem {
  id: string;
  compra_id: string;
  material_id: string;
  quantidade: number;
  valor_unitario: number;
  total_item: number;
  created_at?: string;
  
  material?: Material;
}

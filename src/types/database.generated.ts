export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          empresa_id: string
          id: string
          is_legacy: boolean
          plano_id: string
          started_at: string | null
          status: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          empresa_id: string
          id?: string
          is_legacy?: boolean
          plano_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          empresa_id?: string
          id?: string
          is_legacy?: boolean
          plano_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_event_catalog: {
        Row: {
          created_at: string
          description: string | null
          event_code: string
          id: string
          is_active: boolean
          label: string
          module: string
          supports_conditions: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_code: string
          id?: string
          is_active?: boolean
          label: string
          module: string
          supports_conditions?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_code?: string
          id?: string
          is_active?: boolean
          label?: string
          module?: string
          supports_conditions?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      automation_events: {
        Row: {
          created_at: string
          empresa_id: string
          event_code: string
          id: string
          module: string
          occurred_at: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          event_code: string
          id?: string
          module: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          event_code?: string
          id?: string
          module?: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          channels: string[]
          condition: Json
          created_at: string
          created_by: string | null
          days_of_week: number[]
          description: string | null
          empresa_id: string
          id: string
          is_active: boolean
          kind: string
          message_template: string
          module: string
          name: string
          priority: string
          recipients: string[]
          schedule_time: string | null
          timezone: string | null
          title_template: string
          trigger_code: string | null
          updated_at: string
        }
        Insert: {
          channels?: string[]
          condition?: Json
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          description?: string | null
          empresa_id: string
          id?: string
          is_active?: boolean
          kind?: string
          message_template: string
          module?: string
          name: string
          priority?: string
          recipients?: string[]
          schedule_time?: string | null
          timezone?: string | null
          title_template?: string
          trigger_code?: string | null
          updated_at?: string
        }
        Update: {
          channels?: string[]
          condition?: Json
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          description?: string | null
          empresa_id?: string
          id?: string
          is_active?: boolean
          kind?: string
          message_template?: string
          module?: string
          name?: string
          priority?: string
          recipients?: string[]
          schedule_time?: string | null
          timezone?: string | null
          title_template?: string
          trigger_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          communication_id: string | null
          created_at: string
          empresa_id: string
          error_message: string | null
          event_id: string | null
          executed_at: string
          id: string
          occurrence_key: string
          rule_id: string
          status: string
        }
        Insert: {
          communication_id?: string | null
          created_at?: string
          empresa_id: string
          error_message?: string | null
          event_id?: string | null
          executed_at?: string
          id?: string
          occurrence_key: string
          rule_id: string
          status?: string
        }
        Update: {
          communication_id?: string | null
          created_at?: string
          empresa_id?: string
          error_message?: string | null
          event_id?: string | null
          executed_at?: string
          id?: string
          occurrence_key?: string
          rule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "automation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_attachments: {
        Row: {
          communication_id: string
          created_at: string
          empresa_id: string
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
        }
        Insert: {
          communication_id: string
          created_at?: string
          empresa_id: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
        }
        Update: {
          communication_id?: string
          created_at?: string
          empresa_id?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_attachments_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_attachments_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_recipients: {
        Row: {
          communication_id: string
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          empresa_id: string
          id: string
          operator_id: string
          read_at: string | null
        }
        Insert: {
          communication_id: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          operator_id: string
          read_at?: string | null
        }
        Update: {
          communication_id?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          operator_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_recipients_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_recipients_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          automation_rule_id: string | null
          created_at: string
          created_by: string | null
          empresa_id: string
          expiration_date: string | null
          id: string
          is_active: boolean
          message: string
          priority: string
          push_dispatch_completed_at: string | null
          push_dispatch_error: string | null
          push_dispatch_requested_at: string | null
          push_dispatch_sent_count: number
          push_dispatch_started_at: string | null
          push_dispatch_status: string
          push_dispatch_total: number
          target_audience: string
          target_operator_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          automation_rule_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority: string
          push_dispatch_completed_at?: string | null
          push_dispatch_error?: string | null
          push_dispatch_requested_at?: string | null
          push_dispatch_sent_count?: number
          push_dispatch_started_at?: string | null
          push_dispatch_status?: string
          push_dispatch_total?: number
          target_audience: string
          target_operator_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          automation_rule_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          push_dispatch_completed_at?: string | null
          push_dispatch_error?: string | null
          push_dispatch_requested_at?: string | null
          push_dispatch_sent_count?: number
          push_dispatch_started_at?: string | null
          push_dispatch_status?: string
          push_dispatch_total?: number
          target_audience?: string
          target_operator_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_target_operator_id_fkey"
            columns: ["target_operator_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_materiais: {
        Row: {
          created_at: string
          data_compra: string
          empresa_id: string
          fornecedor: string | null
          fornecedor_id: string | null
          id: string
          numero_recibo: string | null
          obra_id: string
          observacao: string | null
          registrado_em: string
          registrado_por: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_compra?: string
          empresa_id: string
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_recibo?: string | null
          obra_id: string
          observacao?: string | null
          registrado_em?: string
          registrado_por: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_compra?: string
          empresa_id?: string
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_recibo?: string | null
          obra_id?: string
          observacao?: string | null
          registrado_em?: string
          registrado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_materiais_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_materiais_itens: {
        Row: {
          compra_id: string
          created_at: string
          empresa_id: string
          funcionario_id: string | null
          id: string
          material_id: string
          quantidade: number
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          compra_id: string
          created_at?: string
          empresa_id: string
          funcionario_id?: string | null
          id?: string
          material_id: string
          quantidade: number
          valor_total?: number | null
          valor_unitario?: number
        }
        Update: {
          compra_id?: string
          created_at?: string
          empresa_id?: string
          funcionario_id?: string | null
          id?: string
          material_id?: string
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_materiais_itens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras_materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_compras_materiais"
            referencedColumns: ["compra_id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      emprestimos_ferramentas: {
        Row: {
          condicao_devolucao:
            | Database["public"]["Enums"]["return_condition"]
            | null
          created_at: string
          data_devolucao: string | null
          data_emprestimo: string
          empresa_id: string
          ferramenta_id: string
          funcionario_id: string
          id: string
          obra_id: string
          observacao_devolucao: string | null
          operador_devolucao_id: string | null
          operador_emprestimo_id: string
          updated_at: string
        }
        Insert: {
          condicao_devolucao?:
            | Database["public"]["Enums"]["return_condition"]
            | null
          created_at?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          empresa_id: string
          ferramenta_id: string
          funcionario_id: string
          id?: string
          obra_id: string
          observacao_devolucao?: string | null
          operador_devolucao_id?: string | null
          operador_emprestimo_id: string
          updated_at?: string
        }
        Update: {
          condicao_devolucao?:
            | Database["public"]["Enums"]["return_condition"]
            | null
          created_at?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          empresa_id?: string
          ferramenta_id?: string
          funcionario_id?: string
          id?: string
          obra_id?: string
          observacao_devolucao?: string | null
          operador_devolucao_id?: string | null
          operador_emprestimo_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emprestimos_ferramentas_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "ferramentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_operador_devolucao_id_fkey"
            columns: ["operador_devolucao_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_operador_emprestimo_id_fkey"
            columns: ["operador_emprestimo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          codigo_interno: string
          created_at: string
          created_by: string | null
          empresa_id: string
          foto_path: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          observacoes: string | null
          status: Database["public"]["Enums"]["tool_status"]
          ultima_manutencao: string | null
          updated_at: string
        }
        Insert: {
          codigo_interno: string
          created_at?: string
          created_by?: string | null
          empresa_id: string
          foto_path?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["tool_status"]
          ultima_manutencao?: string | null
          updated_at?: string
        }
        Update: {
          codigo_interno?: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          foto_path?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["tool_status"]
          ultima_manutencao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ferramentas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferramentas_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string
          email: string | null
          empresa_id: string
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string | null
          site: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          agencia: string | null
          ativo: boolean
          chave_pix: string | null
          conta: string | null
          created_at: string
          data_admissao: string | null
          data_desligamento: string | null
          empresa_id: string
          forma_pagamento: string | null
          funcao_id: string
          id: string
          nome: string
          obra_id: string
          observacao_pagamento: string | null
          photo_path: string | null
          tipo_colaborador: string
          tipo_conta: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          chave_pix?: string | null
          conta?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          funcao_id: string
          id?: string
          nome: string
          obra_id: string
          observacao_pagamento?: string | null
          photo_path?: string | null
          tipo_colaborador?: string
          tipo_conta?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          chave_pix?: string | null
          conta?: string | null
          created_at?: string
          data_admissao?: string | null
          data_desligamento?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          funcao_id?: string
          id?: string
          nome?: string
          obra_id?: string
          observacao_pagamento?: string | null
          photo_path?: string | null
          tipo_colaborador?: string
          tipo_conta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["funcao_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "funcionarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      funcoes: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
          updated_at: string
          valor_diaria: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
          valor_diaria: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
          valor_diaria?: number
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ferramentas: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          evento: Database["public"]["Enums"]["tool_event_type"]
          ferramenta_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          evento: Database["public"]["Enums"]["tool_event_type"]
          ferramenta_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          evento?: Database["public"]["Enums"]["tool_event_type"]
          ferramenta_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_ferramentas_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "ferramentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_disponiveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferramentas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          empresa_id: string
          id: string
          nome: string
          ordem: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          ordem?: number
          unidade: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          ordem?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_materiais"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_estoque_materiais_consolidado"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_movimentacoes_materiais"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "materiais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_compras_materiais"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "materiais_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      material_movimentacoes: {
        Row: {
          compra_item_id: string | null
          created_at: string
          data_movimento: string
          empresa_id: string
          id: string
          material_id: string
          motivo: string | null
          obra_destino_id: string | null
          obra_id: string
          observacao: string | null
          quantidade: number
          registrado_por: string | null
          tipo: string
          updated_at: string
          valor_unitario: number | null
        }
        Insert: {
          compra_item_id?: string | null
          created_at?: string
          data_movimento?: string
          empresa_id: string
          id?: string
          material_id: string
          motivo?: string | null
          obra_destino_id?: string | null
          obra_id: string
          observacao?: string | null
          quantidade: number
          registrado_por?: string | null
          tipo: string
          updated_at?: string
          valor_unitario?: number | null
        }
        Update: {
          compra_item_id?: string | null
          created_at?: string
          data_movimento?: string
          empresa_id?: string
          id?: string
          material_id?: string
          motivo?: string | null
          obra_destino_id?: string | null
          obra_id?: string
          observacao?: string | null
          quantidade?: number
          registrado_por?: string | null
          tipo?: string
          updated_at?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_movimentacoes_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: true
            referencedRelation: "compras_materiais_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: true
            referencedRelation: "vw_relatorio_compras_materiais"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_certificates: {
        Row: {
          created_at: string
          created_by: string | null
          days: number
          description: string | null
          employee_id: string
          empresa_id: string
          end_date: string
          id: string
          photo_path: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days: number
          description?: string | null
          employee_id: string
          empresa_id: string
          end_date: string
          id?: string
          photo_path?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days?: number
          description?: string | null
          employee_id?: string
          empresa_id?: string
          end_date?: string
          id?: string
          photo_path?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "medical_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "medical_certificates_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
          parent_obra_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          parent_obra_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          parent_obra_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          max_funcionarios: number
          max_operadores: number
          nome: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          max_funcionarios: number
          max_operadores: number
          nome: string
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          max_funcionarios?: number
          max_operadores?: number
          nome?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          empresa_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          owner_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          empresa_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          owner_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          empresa_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_audit_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_company_requests: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome_empresa: string
          notes: string | null
          payment_reference: string | null
          payment_status: string
          pix_txid: string | null
          plano_id: string | null
          responsavel_nome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          id?: string
          nome_empresa: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          pix_txid?: string | null
          plano_id?: string | null
          responsavel_nome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome_empresa?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          pix_txid?: string | null
          plano_id?: string | null
          responsavel_nome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_company_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_company_requests_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_company_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "platform_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_owners: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_payments: {
        Row: {
          amount: number
          assinatura_id: string | null
          confirmed_by: string | null
          created_at: string
          due_date: string | null
          empresa_id: string | null
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          pix_txid: string | null
          plano_id: string | null
          reference: string | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          assinatura_id?: string | null
          confirmed_by?: string | null
          created_at?: string
          due_date?: string | null
          empresa_id?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          pix_txid?: string | null
          plano_id?: string | null
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assinatura_id?: string | null
          confirmed_by?: string | null
          created_at?: string
          due_date?: string | null
          empresa_id?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          pix_txid?: string | null
          plano_id?: string | null
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "platform_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "platform_company_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          published: boolean
          published_at: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          created_at: string
          data: string
          empresa_id: string
          funcionario_id: string
          id: string
          obra_id: string
          percentual_diaria: number
          photo_path: string | null
          photo_taken_at: string | null
          photo_taken_by: string | null
          presente: boolean
          tipo_diaria: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          empresa_id: string
          funcionario_id: string
          id?: string
          obra_id: string
          percentual_diaria?: number
          photo_path?: string | null
          photo_taken_at?: string | null
          photo_taken_by?: string | null
          presente: boolean
          tipo_diaria?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          empresa_id?: string
          funcionario_id?: string
          id?: string
          obra_id?: string
          percentual_diaria?: number
          photo_path?: string | null
          photo_taken_at?: string | null
          photo_taken_by?: string | null
          presente?: boolean
          tipo_diaria?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "presencas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "presencas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      push_devices: {
        Row: {
          ativo: boolean
          created_at: string
          dispositivo_id: string | null
          empresa_id: string
          id: string
          plataforma: string
          token: string
          ultimo_uso_at: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dispositivo_id?: string | null
          empresa_id: string
          id?: string
          plataforma: string
          token: string
          ultimo_uso_at?: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dispositivo_id?: string | null
          empresa_id?: string
          id?: string
          plataforma?: string
          token?: string
          ultimo_uso_at?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_devices_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          login: string | null
          nome: string | null
          perfil: string
          senha: string
          telefone: string | null
          tipo_usuario: string | null
          updated_at: string
          usuario: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          login?: string | null
          nome?: string | null
          perfil: string
          senha: string
          telefone?: string | null
          tipo_usuario?: string | null
          updated_at?: string
          usuario: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          login?: string | null
          nome?: string | null
          perfil?: string
          senha?: string
          telefone?: string | null
          tipo_usuario?: string | null
          updated_at?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_dashboard_equipe_detalhada: {
        Row: {
          ajudantes_presentes: number | null
          alerta_equipe: string | null
          apontadores_presentes: number | null
          clt_ativos: number | null
          clt_presentes_hoje: number | null
          diaristas_ativos: number | null
          diaristas_presentes_hoje: number | null
          empresa_id: string | null
          faltas_hoje: number | null
          funcionarios_ativos: number | null
          obra: string | null
          obra_id: string | null
          obra_principal: string | null
          parent_obra_id: string | null
          pedreiros_presentes: number | null
          presentes_hoje: number | null
          sem_registro_hoje: number | null
          serventes_por_pedreiro: number | null
          serventes_presentes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      vw_dashboard_equipe_tempo_real: {
        Row: {
          ajudantes_presentes: number | null
          alerta_equipe: string | null
          apontadores_presentes: number | null
          clt_ativos: number | null
          clt_presentes_hoje: number | null
          diaristas_ativos: number | null
          diaristas_presentes_hoje: number | null
          empresa_id: string | null
          faltas_hoje: number | null
          funcionarios_ativos: number | null
          obra: string | null
          obra_id: string | null
          pedreiros_presentes: number | null
          presentes_hoje: number | null
          sem_registro_hoje: number | null
          serventes_por_pedreiro: number | null
          serventes_presentes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_equipe_tempo_real: {
        Row: {
          empresa_id: string | null
          funcao: string | null
          funcao_id: string | null
          obra: string | null
          obra_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          quantidade: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_equipe_tempo_real_resumo: {
        Row: {
          empresa_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          quantidade_obras: number | null
          total_funcionarios: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_materiais: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          empresa_id: string | null
          entradas: number | null
          material: string | null
          material_id: string | null
          obra: string | null
          obra_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          parent_obra_id: string | null
          saidas: number | null
          saldo: number | null
          status_estoque: string | null
          unidade: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      vw_estoque_materiais_consolidado: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          empresa_id: string | null
          entradas: number | null
          material: string | null
          material_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          quantidade_obras_com_movimentacao: number | null
          saidas: number | null
          saldo: number | null
          unidade: string | null
        }
        Relationships: []
      }
      vw_ferramentas_disponiveis: {
        Row: {
          codigo_interno: string | null
          foto_path: string | null
          id: string | null
          marca: string | null
          modelo: string | null
          nome: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["tool_status"] | null
        }
        Insert: {
          codigo_interno?: string | null
          foto_path?: string | null
          id?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["tool_status"] | null
        }
        Update: {
          codigo_interno?: string | null
          foto_path?: string | null
          id?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["tool_status"] | null
        }
        Relationships: []
      }
      vw_ferramentas_localizacao: {
        Row: {
          codigo_interno: string | null
          data_emprestimo: string | null
          emprestimo_id: string | null
          funcionario: string | null
          funcionario_id: string | null
          id: string | null
          marca: string | null
          modelo: string | null
          nome: string | null
          obra: string | null
          obra_id: string | null
          status: Database["public"]["Enums"]["tool_status"] | null
        }
        Relationships: []
      }
      vw_folha_diarias: {
        Row: {
          data: string | null
          data_admissao: string | null
          data_desligamento: string | null
          eh_clt: boolean | null
          empresa_id: string | null
          funcao: string | null
          funcionario: string | null
          funcionario_ativo: boolean | null
          funcionario_id: string | null
          id: string | null
          obra: string | null
          obra_ativa: boolean | null
          obra_id: string | null
          obra_principal: string | null
          percentual_diaria: number | null
          status: string | null
          subobra: string | null
          subobra_id: string | null
          tipo_colaborador: string | null
          tipo_diaria: string | null
          valor_calculado: number | null
          valor_diaria: number | null
          valor_relatorio: string | null
        }
        Relationships: []
      }
      vw_funcionarios_ativos_por_funcao: {
        Row: {
          funcao: string | null
          funcao_id: string | null
          total_funcionarios: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["funcao_id"]
          },
        ]
      }
      vw_movimentacoes_materiais: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          compra_item_id: string | null
          created_at: string | null
          data_movimento: string | null
          empresa_id: string | null
          id: string | null
          material: string | null
          material_id: string | null
          motivo: string | null
          obra: string | null
          obra_destino: string | null
          obra_destino_id: string | null
          obra_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          observacao: string | null
          parent_obra_id: string | null
          quantidade: number | null
          registrado_por: string | null
          registrado_por_nome: string | null
          tipo: string | null
          unidade: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_movimentacoes_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: true
            referencedRelation: "compras_materiais_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_compra_item_id_fkey"
            columns: ["compra_item_id"]
            isOneToOne: true
            referencedRelation: "vw_relatorio_compras_materiais"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_destino_id_fkey"
            columns: ["obra_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "material_movimentacoes_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      vw_quadro_funcionarios_tempo_real: {
        Row: {
          empresa_id: string | null
          funcao: string | null
          funcao_id: string | null
          obra: string | null
          obra_id: string | null
          parent_obra_id: string | null
          total_funcionarios: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["funcao_id"]
          },
          {
            foreignKeyName: "obras_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      vw_relatorio_compras_materiais: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          compra_id: string | null
          data_compra: string | null
          empresa_id: string | null
          fornecedor: string | null
          funcionario_destinatario: string | null
          funcionario_id: string | null
          item_id: string | null
          material: string | null
          material_id: string | null
          numero_recibo: string | null
          obra: string | null
          obra_id: string | null
          obra_principal: string | null
          obra_principal_id: string | null
          observacao_compra: string | null
          parent_obra_id: string | null
          quantidade: number | null
          registrado_por: string | null
          registrado_por_nome: string | null
          unidade: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_materiais_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["funcionario_id"]
          },
          {
            foreignKeyName: "compras_materiais_itens_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "compras_materiais_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_detalhada"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_equipe_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_ferramentas_localizacao"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_quadro_funcionarios_tempo_real"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obras_parent_obra_id_fkey"
            columns: ["parent_obra_id"]
            isOneToOne: false
            referencedRelation: "vw_relatorio_funcionarios_clt"
            referencedColumns: ["obra_id"]
          },
        ]
      }
      vw_relatorio_funcionarios_clt: {
        Row: {
          data: string | null
          data_admissao: string | null
          data_desligamento: string | null
          eh_clt: boolean | null
          empresa_id: string | null
          funcao: string | null
          funcionario: string | null
          funcionario_ativo: boolean | null
          funcionario_id: string | null
          id: string | null
          obra: string | null
          obra_ativa: boolean | null
          obra_id: string | null
          obra_principal: string | null
          photo_path: string | null
          photo_taken_at: string | null
          status: string | null
          subobra: string | null
          subobra_id: string | null
          tipo_colaborador: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_fk"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_relatorio_presencas: {
        Row: {
          data: string | null
          data_admissao: string | null
          data_desligamento: string | null
          eh_clt: boolean | null
          empresa_id: string | null
          funcao: string | null
          funcionario: string | null
          funcionario_ativo: boolean | null
          funcionario_id: string | null
          id: string | null
          obra: string | null
          obra_ativa: boolean | null
          obra_id: string | null
          obra_principal: string | null
          percentual_diaria: number | null
          status: string | null
          subobra: string | null
          subobra_id: string | null
          tipo_colaborador: string | null
          tipo_diaria: string | null
          valor_calculado: number | null
          valor_diaria: number | null
          valor_relatorio: string | null
        }
        Relationships: []
      }
      vw_resumo_materiais_obra: {
        Row: {
          empresa_id: string | null
          materiais_com_estoque: number | null
          obra_principal: string | null
          obra_principal_id: string | null
          obras_envolvidas: number | null
          quantidade_total_em_estoque: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      atribuir_funcionarios_obra: {
        Args: { p_funcionario_ids: string[]; p_obra_id: string }
        Returns: {
          funcionario_id: string
          nome: string
          obra_anterior_id: string
          obra_nova_id: string
        }[]
      }
      automation_condition_matches: {
        Args: {
          p_now?: string
          p_rule: Database["public"]["Tables"]["automation_rules"]["Row"]
        }
        Returns: boolean
      }
      automation_create_communication: {
        Args: {
          p_event_id?: string
          p_occurrence_key?: string
          p_payload?: Json
          p_rule_id: string
        }
        Returns: string
      }
      automation_emit_event: {
        Args: {
          p_event_code: string
          p_module: string
          p_occurred_at?: string
          p_payload?: Json
        }
        Returns: string
      }
      automation_process_event: {
        Args: { p_event_id: string }
        Returns: number
      }
      automation_process_scheduled: { Args: never; Returns: number }
      automation_process_tool_pending_event: { Args: never; Returns: number }
      automation_render_template: {
        Args: { p_payload: Json; p_template: string }
        Returns: string
      }
      automation_tools_condition: {
        Args: {
          p_now?: string
          p_rule: Database["public"]["Tables"]["automation_rules"]["Row"]
        }
        Returns: boolean
      }
      cadastrar_fornecedor_rapido: {
        Args: { p_empresa_id: string; p_nome: string; p_usuario_id: string }
        Returns: {
          criado_agora: boolean
          fornecedor_id: string
        }[]
      }
      definir_meia_diaria: {
        Args: { p_presenca_id: string; p_usuario_id: string }
        Returns: {
          percentual_diaria: number
          presenca_id: string
          tipo_diaria: string
          valor_calculado: number
          valor_diaria: number
        }[]
      }
      emprestar_ferramenta: {
        Args: {
          p_ferramenta_id: string
          p_funcionario_id: string
          p_obra_id: string
        }
        Returns: string
      }
      excluir_compra_material: {
        Args: {
          p_compra_id: string
          p_empresa_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      get_internal_push_dispatch_secret: { Args: never; Returns: string }
      registrar_compra_material: {
        Args: {
          p_data_compra?: string
          p_empresa_id: string
          p_fornecedor_id: string
          p_itens?: Json
          p_numero_recibo?: string
          p_obra_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      registrar_movimentacao_material: {
        Args: {
          p_data_movimento?: string
          p_empresa_id: string
          p_material_id: string
          p_motivo?: string
          p_obra_destino_id?: string
          p_obra_id: string
          p_observacao?: string
          p_quantidade: number
          p_tipo: string
          p_usuario_id?: string
          p_valor_unitario?: number
        }
        Returns: string
      }
      registrar_push_device: {
        Args: {
          p_dispositivo_id?: string
          p_plataforma: string
          p_token: string
          p_usuario_id: string
        }
        Returns: Json
      }
      request_communication_push: {
        Args: { p_communication_id: string; p_usuario_id: string }
        Returns: {
          communication_id: string
          push_dispatch_requested_at: string
          push_dispatch_status: string
        }[]
      }
      reverter_meia_diaria: {
        Args: { p_presenca_id: string; p_usuario_id: string }
        Returns: {
          percentual_diaria: number
          presenca_id: string
          tipo_diaria: string
          valor_calculado: number
          valor_diaria: number
        }[]
      }
      transformar_em_meia_diaria: {
        Args: { p_presenca_id: string; p_usuario_id: string }
        Returns: {
          percentual_diaria: number
          presenca_id: string
          tipo_diaria: string
          valor_calculado: number
          valor_diaria: number
        }[]
      }
    }
    Enums: {
      return_condition: "PERFEITO_ESTADO" | "DANIFICADA"
      tool_event_type:
        | "CADASTRO"
        | "EDICAO"
        | "EMPRESTIMO"
        | "DEVOLUCAO"
        | "REPARO"
        | "PERDA"
        | "INATIVACAO"
        | "REATIVACAO"
      tool_status: "ATIVA" | "EMPRESTADA" | "EM_REPARO" | "PERDIDA" | "INATIVA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      return_condition: ["PERFEITO_ESTADO", "DANIFICADA"],
      tool_event_type: [
        "CADASTRO",
        "EDICAO",
        "EMPRESTIMO",
        "DEVOLUCAO",
        "REPARO",
        "PERDA",
        "INATIVACAO",
        "REATIVACAO",
      ],
      tool_status: ["ATIVA", "EMPRESTADA", "EM_REPARO", "PERDIDA", "INATIVA"],
    },
  },
} as const


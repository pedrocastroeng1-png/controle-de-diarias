const fs = require('fs');

let content = fs.readFileSync('src/lib/api.ts', 'utf-8');

// Add imports
if (!content.includes('AutomationRule')) {
  content = content.replace(
    /import {([^}]+)HistoricoFerramenta([^}]*)} from '\.\/types';/,
    "import {$1HistoricoFerramenta$2, AutomationRule, AutomationEventCatalog, AutomationRun} from './types';"
  );
}

const methods = `
  // Automations
  getAutomationRules: async (): Promise<AutomationRule[]> => {
    if (isMock) return [];
    if (!supabase) return [];
    const { data, error } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getAutomationEventCatalog: async (): Promise<AutomationEventCatalog[]> => {
    if (isMock) return [];
    if (!supabase) return [];
    const { data, error } = await supabase.from('automation_event_catalog').select('*').eq('is_active', true).order('module', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getAutomationRuns: async (): Promise<AutomationRun[]> => {
    if (isMock) return [];
    if (!supabase) return [];
    const { data, error } = await supabase.from('automation_runs').select('*, rule:rule_id(*)').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  },

  createAutomationRule: async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule> => {
    if (isMock) throw new Error('Mock not supported for automations');
    if (!supabase) throw new Error('Supabase not connected');
    const { data, error } = await supabase.from('automation_rules').insert(rule).select().single();
    if (error) throw error;
    return data;
  },

  updateAutomationRule: async (id: string, rule: Partial<AutomationRule>): Promise<AutomationRule> => {
    if (isMock) throw new Error('Mock not supported for automations');
    if (!supabase) throw new Error('Supabase not connected');
    const { data, error } = await supabase.from('automation_rules').update(rule).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteAutomationRule: async (id: string): Promise<void> => {
    if (isMock) return;
    if (!supabase) throw new Error('Supabase not connected');
    const { error } = await supabase.from('automation_rules').delete().eq('id', id);
    if (error) throw error;
  },
`;

if (!content.includes('getAutomationRules')) {
  content = content.replace(/};\s*$/, methods + '\n};');
  fs.writeFileSync('src/lib/api.ts', content, 'utf-8');
  console.log("Patched api.ts");
} else {
  console.log("Already patched");
}

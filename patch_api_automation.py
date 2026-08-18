import re

with open('src/lib/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

imports = ", AutomationRule, AutomationEventCatalog, AutomationRun"
content = re.sub(r'import {([^}]+)HistoricoFerramenta([^}]+)} from \'./types\';', r"import {\g<1>HistoricoFerramenta\g<2>" + imports + "} from './types';", content)

new_methods = """
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
"""

# Insert before the last `};`
if new_methods not in content:
    content = re.sub(r'(\n};\n)$', r'\n' + new_methods + r'\1', content)
    with open('src/lib/api.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched api.ts")
else:
    print("Already patched")

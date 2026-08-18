const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

// Replace DIAS_SEMANA
code = code.replace(
  "const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];",
  `const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];`
);

// Replace DESTINATARIOS
code = code.replace(
  "const DESTINATARIOS = ['ADMINISTRADORES', 'OPERADORES', 'CONSULTA'];",
  `const DESTINATARIOS = [
  { value: 'ADMIN', label: 'Administradores' },
  { value: 'OPERADORES', label: 'Operadores' },
  { value: 'TODOS', label: 'Todos' }
];`
);

// Replace toggleArrayItem
code = code.replace(
  "const toggleArrayItem = (field: 'days_of_week' | 'recipients' | 'channels', item: string) => {",
  "const toggleArrayItem = (field: 'days_of_week' | 'recipients' | 'channels', item: any) => {"
);

// Replace the checkboxes maps
// For DIAS_SEMANA
code = code.replace(
  /\{DIAS_SEMANA\.map\(dia => \([\s\S]*?<span className="text-sm text-slate-700">\{dia\}<\/span>[\s\S]*?<\/label>\s*\)\}/,
  `{DIAS_SEMANA.map(dia => (
                      <label key={dia.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(formData.days_of_week || []).includes(dia.value as any)}
                          onChange={() => toggleArrayItem('days_of_week', dia.value)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{dia.label}</span>
                      </label>
                    ))}`
);

// For DESTINATARIOS
code = code.replace(
  /\{DESTINATARIOS\.map\(dest => \([\s\S]*?<span className="text-sm text-slate-700">\{dest\}<\/span>[\s\S]*?<\/label>\s*\)\}/,
  `{DESTINATARIOS.map(dest => (
                    <label key={dest.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.recipients || []).includes(dest.value)}
                        onChange={() => toggleArrayItem('recipients', dest.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{dest.label}</span>
                    </label>
                  ))}`
);

// We need to rewrite useEffect and handleSubmit.
const handleSubmitRegex = /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?onSave\(formData\);\s*\};/;
const newHandleSubmit = `const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Nome da automação é obrigatório.');
    if (!formData.message_template.trim()) return alert('Mensagem é obrigatória.');
    if (!formData.recipients || formData.recipients.length === 0) return alert('Selecione pelo menos um destinatário.');
    if (!formData.channels || formData.channels.length === 0) return alert('Selecione pelo menos um canal.');

    const payload = { ...formData };
    
    // Normalize empty strings to null for optional fields (if they allow null)
    if (!payload.title_template) payload.title_template = ''; // or null if your DB requires it, but string is usually safe. Wait, the req says "title_template pode continuar string vazia se o schema permitir." 
    
    if (payload.kind === 'EVENTO') {
      if (!payload.trigger_code) return alert('Selecione o evento que irá disparar a automação.');
      payload.schedule_time = null as any;
      payload.timezone = null as any;
      payload.days_of_week = [];
    } else if (payload.kind === 'PROGRAMADA') {
      if (!payload.schedule_time) return alert('Horário é obrigatório para automações programadas.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return alert('Selecione pelo menos um dia da semana.');
      payload.trigger_code = null as any;
    } else if (payload.kind === 'CONDICIONAL') {
      if (!payload.schedule_time) return alert('Horário é obrigatório para automações condicionais.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return alert('Selecione pelo menos um dia da semana.');
      if (!payload.trigger_code) return alert('Selecione o evento condicional.');
    }

    onSave(payload);
  };`;

code = code.replace(handleSubmitRegex, newHandleSubmit);

// Rewrite useEffect
const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}\s*\}, \[rule\]\);/;
const newUseEffect = `useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        kind: rule.kind,
        module: rule.module,
        is_active: rule.is_active,
        message_template: rule.message_template || '',
        title_template: rule.title_template || '',
        days_of_week: rule.days_of_week || [],
        schedule_time: rule.schedule_time !== null && rule.schedule_time !== undefined ? rule.schedule_time : null as any,
        timezone: rule.timezone !== null && rule.timezone !== undefined ? rule.timezone : null as any,
        recipients: rule.recipients || [],
        channels: rule.channels || [],
        trigger_code: rule.trigger_code !== null && rule.trigger_code !== undefined ? rule.trigger_code : null as any
      });
    }
  }, [rule]);`;

code = code.replace(useEffectRegex, newUseEffect);


// For inputs that might receive null, they need fallback for React controlled components
// schedule_time
code = code.replace(/value=\{formData\.schedule_time \|\| ''\}/g, "value={formData.schedule_time || ''}");
// timezone
code = code.replace(/value=\{formData\.timezone \|\| 'America\/Maceio'\}/g, "value={formData.timezone || 'America/Maceio'}");
// trigger_code
code = code.replace(/value=\{formData\.trigger_code \|\| ''\}/g, "value={formData.trigger_code || ''}");

fs.writeFileSync('src/pages/admin/AutomationsForm.tsx', code, 'utf-8');

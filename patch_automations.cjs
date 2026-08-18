const fs = require('fs');

// Patch Automations.tsx
let automations = fs.readFileSync('src/pages/admin/Automations.tsx', 'utf-8');
automations = automations.replace(
  /alert\('Erro ao salvar automação\. Verifique os dados e tente novamente\.'\);\s*\}/g,
  "throw error;\n    }"
);
fs.writeFileSync('src/pages/admin/Automations.tsx', automations, 'utf-8');

// Patch AutomationsForm.tsx
let form = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

// 1. Update Props
form = form.replace(
  "onSave: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => void;",
  "onSave: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;"
);

// 2. Import CheckCircle and AlertCircle
if (!form.includes('CheckCircle')) {
  form = form.replace(
    "import { X, Save, Send } from 'lucide-react';",
    "import { X, Save, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';"
  );
}

// 3. Add state
form = form.replace(
  "export default function AutomationsForm({ rule, catalog, onClose, onSave }: AutomationsFormProps) {\n  const { usuario } = useAuth();",
  "export default function AutomationsForm({ rule, catalog, onClose, onSave }: AutomationsFormProps) {\n  const { usuario } = useAuth();\n  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isTesting, setIsTesting] = useState(false);\n  const [localError, setLocalError] = useState('');\n  const [localSuccess, setLocalSuccess] = useState('');"
);

// 4. Update handleSubmit
const oldSubmitRegex = /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?onSave\(payload\);\s*\};/;
const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');
    
    if (!formData.name.trim()) return setLocalError('Nome da automação é obrigatório.');
    if (!formData.message_template.trim()) return setLocalError('Mensagem é obrigatória.');
    if (!formData.recipients || formData.recipients.length === 0) return setLocalError('Selecione pelo menos um destinatário.');
    if (!formData.channels || formData.channels.length === 0) return setLocalError('Selecione pelo menos um canal.');

    const payload = { ...formData };
    
    if (!payload.title_template) payload.title_template = '';
    
    if (payload.kind === 'EVENTO') {
      if (!payload.trigger_code) return setLocalError('Selecione o evento que irá disparar a automação.');
      payload.schedule_time = null as any;
      payload.timezone = null as any;
      payload.days_of_week = [];
    } else if (payload.kind === 'PROGRAMADA') {
      if (!payload.schedule_time) return setLocalError('Horário é obrigatório para automações programadas.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return setLocalError('Selecione pelo menos um dia da semana.');
      payload.trigger_code = null as any;
    } else if (payload.kind === 'CONDICIONAL') {
      if (!payload.schedule_time) return setLocalError('Horário é obrigatório para automações condicionais.');
      if (!payload.days_of_week || payload.days_of_week.length === 0) return setLocalError('Selecione pelo menos um dia da semana.');
      if (!payload.trigger_code) return setLocalError('Selecione o evento condicional.');
    }

    try {
      setIsSubmitting(true);
      await onSave(payload);
      setLocalSuccess('Automação salva com sucesso.');
    } catch (err) {
      setLocalError('Erro ao salvar automação. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

form = form.replace(oldSubmitRegex, newSubmit);

// 5. Update handleTest
const oldTestRegex = /const handleTest = async \(\) => \{[\s\S]*?\}\s*\};/;
const newTest = `const handleTest = async () => {
    setLocalError('');
    setLocalSuccess('');
    if (!formData.channels || formData.channels.length === 0) {
      return setLocalError('Selecione pelo menos um canal para enviar o teste.');
    }
    if (!usuario?.id) {
      return setLocalError('Não foi possível identificar o usuário atual.');
    }
    try {
      setIsTesting(true);
      await api.sendAutomationTest({
        title: formData.title_template || 'Teste de Automação',
        message: formData.message_template || '',
        channels: formData.channels as string[],
        userId: usuario.id
      });
      setLocalSuccess('Teste enviado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      if (error.message === 'PUSH_FAILED') {
        setLocalError('Comunicação criada, mas o Push não pôde ser enviado.');
      } else {
        setLocalError(error.message || 'Erro real da operação.');
      }
    } finally {
      setIsTesting(false);
    }
  };`;

form = form.replace(oldTestRegex, newTest);

// 6. Update Render to show messages and button states
const formOpeningRegex = /<form id="automationForm" onSubmit=\{handleSubmit\} className="space-y-6">/;
const feedbackUI = `
          {localError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{localError}</p>
            </div>
          )}
          {localSuccess && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{localSuccess}</p>
            </div>
          )}
          <form id="automationForm" onSubmit={handleSubmit} className="space-y-6">`;
form = form.replace(formOpeningRegex, feedbackUI);

const testButtonRegex = /<button\s*type="button"\s*onClick=\{handleTest\}\s*className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"\s*>\s*<Send className="w-4 h-4" \/>\s*Enviar Teste\s*<\/button>/;
const newTestBtn = `<button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isTesting ? 'Enviando...' : 'Enviar Teste'}
          </button>`;
form = form.replace(testButtonRegex, newTestBtn);

const saveButtonRegex = /<button\s*type="submit"\s*form="automationForm"\s*className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"\s*>\s*<Save className="w-4 h-4" \/>\s*Salvar\s*<\/button>/;
const newSaveBtn = `<button
              type="submit"
              form="automationForm"
              disabled={isSubmitting || isTesting}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>`;
form = form.replace(saveButtonRegex, newSaveBtn);

// 7. Disable cancel button while submitting
const cancelBtnRegex = /<button\s*type="button"\s*onClick=\{onClose\}\s*className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"\s*>\s*Cancelar\s*<\/button>/;
const newCancelBtn = `<button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isTesting}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>`;
form = form.replace(cancelBtnRegex, newCancelBtn);

fs.writeFileSync('src/pages/admin/AutomationsForm.tsx', form, 'utf-8');

import { useState } from 'react';
import { MessageCircle, Copy, X } from 'lucide-react';
import { CenteredDialog } from './ui/CenteredDialog';
import { buildWelcomeMessage, type WelcomeUser } from '../lib/welcome-message';
import { whatsAppLink } from '../lib/whatsapp-phone';

export function WelcomeWhatsAppDialog({ user, onClose }: { user: WelcomeUser; onClose: () => void }) {
  const [phone, setPhone] = useState(user.telefone || '');
  const [feedback, setFeedback] = useState('');
  const message = buildWelcomeMessage(user, window.location.origin);
  let link = '';
  let phoneError = '';
  try { link = whatsAppLink(phone, message); } catch (error) { phoneError = (error as Error).message; }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setFeedback('Mensagem copiada. Cole na conversa do destinatário.');
    } catch {
      setFeedback('Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.');
    }
  }

  return <CenteredDialog labelId="welcome-title" onClose={onClose}>
    <div className="w-full max-w-2xl max-h-[90dvh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
      <div className="p-5 border-b flex items-start justify-between gap-3">
        <div><h2 id="welcome-title" className="text-lg font-bold text-slate-900">Boas-vindas pelo WhatsApp</h2>
          <p className="text-sm text-slate-500 mt-1">Confira o destinatário e o guia de {user.nome || user.usuario}.</p></div>
        <button type="button" aria-label="Fechar boas-vindas" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto p-5 space-y-4">
        <div><label htmlFor="welcome-phone" className="block text-sm font-medium mb-1">WhatsApp do destinatário (com DDD)</label>
          <input id="welcome-phone" type="tel" autoComplete="tel" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(82) 99999-9999"
            aria-describedby="welcome-phone-help" aria-invalid={!!phone.trim() && !!phoneError} className="w-full border border-slate-300 rounded-xl px-3 py-2.5" />
          <p id="welcome-phone-help" className="text-xs text-slate-500 mt-1">Este número vale para este envio. Para salvar uma alteração permanente, edite o cadastro do usuário.</p>
          {phone.trim() && phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
        </div>
        <div><label htmlFor="welcome-preview" className="block text-sm font-medium mb-2">Prévia da mensagem</label>
          <textarea id="welcome-preview" readOnly value={message} className="w-full h-72 sm:h-80 resize-y rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm leading-relaxed text-slate-800" /></div>
        <p className="text-sm text-slate-500">Ao abrir o WhatsApp, você ainda precisa tocar em Enviar. Nenhuma mensagem é enviada automaticamente e a senha não é incluída.</p>
        {feedback && <p role="status" className="text-sm text-blue-700">{feedback}</p>}
      </div>
      <div className="p-4 border-t flex flex-wrap justify-end gap-2 bg-slate-50">
        <button type="button" onClick={copyMessage} className="px-4 py-2.5 rounded-xl border bg-white flex items-center gap-2 text-sm"><Copy size={16} />Copiar mensagem</button>
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-medium"><MessageCircle size={18} />Abrir no WhatsApp</a>
          : <button type="button" disabled className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white opacity-50 text-sm">Abrir no WhatsApp</button>}
      </div>
    </div>
  </CenteredDialog>;
}

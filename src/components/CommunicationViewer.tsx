import React, { useState } from 'react';
import { Communication } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, FileText, AlertTriangle, Info, Bell, ChevronRight, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  communications: Communication[];
  onComplete: () => void;
}

export function CommunicationViewer({ communications, onComplete }: Props) {
  const { usuario } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markingRead, setMarkingRead] = useState(false);

  if (!communications || communications.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo certo!</h2>
        <p className="text-xl text-gray-600 mb-8">✅ Todas as comunicações foram lidas.<br/>Bom trabalho!</p>
        <button
          onClick={onComplete}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors text-lg flex items-center"
        >
          Continuar para Presença
          <ChevronRight className="ml-2 w-6 h-6" />
        </button>
      </div>
    );
  }

  const comm = communications[currentIndex];

  const handleRead = async () => {
    if (!usuario) return;
    setMarkingRead(true);
    try {
      await api.markCommunicationRead(comm.id, usuario.id);
      if (currentIndex < communications.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Complete, let the re-render handle the "All read" screen by passing an empty array or calling onComplete
        // Wait, if we change the state here we'd need to modify the array, but it's passed as prop.
        // Let's just increment index and if it exceeds, we show the success screen.
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao confirmar leitura.');
    } finally {
      setMarkingRead(false);
    }
  };

  const isComplete = currentIndex >= communications.length;

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo certo!</h2>
        <p className="text-xl text-gray-600 mb-8">✅ Todas as comunicações foram lidas.<br/>Bom trabalho!</p>
        <button
          onClick={onComplete}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors text-lg flex items-center"
        >
          Continuar para Presença
          <ChevronRight className="ml-2 w-6 h-6" />
        </button>
      </div>
    );
  }

  const priorityColors = {
    NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
    URGENT: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityIcons = {
    NORMAL: <Info className="w-5 h-5 mr-1" />,
    URGENT: <AlertTriangle className="w-5 h-5 mr-1" />
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain mr-3" />
          <h1 className="text-xl font-bold text-gray-900">Comunicado Importante</h1>
        </div>
        <div className="text-sm font-medium text-gray-500">
          {currentIndex + 1} de {communications.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${priorityColors[comm.priority] || priorityColors.NORMAL}`}>
                {priorityIcons[comm.priority] || priorityIcons.NORMAL}
                {comm.priority === 'NORMAL' ? 'Normal' : 'Urgente'}
              </span>
              <span className="text-gray-500 text-sm">
                Enviado em {format(parseISO(comm.created_at), "dd/MM/yyyy 'às' HH:mm")}
              </span>
              <span className="text-gray-500 text-sm">
                por <strong className="text-gray-700">{comm.creator?.usuario || 'Administrador'}</strong>
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
              {comm.title}
            </h2>

            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap mb-10">
              {comm.message}
            </div>

            {comm.attachments && comm.attachments.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-400" />
                  Anexos ({comm.attachments.length})
                </h3>
                <ul className="space-y-3">
                  {comm.attachments.map(att => (
                    <li key={att.id}>
                      <a
                        href={att.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors group"
                      >
                        <FileText className="w-8 h-8 text-blue-500 mr-4 group-hover:scale-110 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {att.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Clique para visualizar
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 md:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={handleRead}
            disabled={markingRead}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 rounded-xl shadow-md transition-colors text-xl flex items-center justify-center disabled:opacity-50"
          >
            {markingRead ? (
              'Confirmando...'
            ) : (
              <>
                <Check className="w-7 h-7 mr-3" />
                Li e compreendi este comunicado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Megaphone } from 'lucide-react';
import { api } from '../lib/api';
import { format } from 'date-fns';

export function CentralCommunicationViewer({ communications, onComplete }: { communications: any[], onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marking, setMarking] = useState(false);

  const currentComm = communications[currentIndex];

  const handleNext = async () => {
    if (marking) return;
    setMarking(true);
    try {
      // Mark as read in central_destinatarios
      const supabase = (api as any)._supabase; // We need a way to update it. Let's add it to api.ts instead!
      await api.markCentralCommunicationAsRead(currentComm.id);
      
      if (currentIndex < communications.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md w-full mx-auto bg-gray-50 h-full">
        <div className="bg-blue-600 px-6 pt-12 pb-6 text-white rounded-b-3xl shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-100 font-medium text-sm tracking-wider uppercase">Nova Mensagem</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">{currentComm.comunicacao.titulo}</h1>
          <p className="text-blue-100 text-sm mt-2">
            Recebida em {format(new Date(currentComm.comunicacao.data_envio || currentComm.comunicacao.created_at), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 whitespace-pre-wrap text-gray-700 text-lg leading-relaxed">
            {currentComm.comunicacao.mensagem}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-400">
              Mensagem {currentIndex + 1} de {communications.length}
            </span>
            <div className="flex space-x-1">
              {communications.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-gray-200'}`} />
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleNext}
            disabled={marking}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <span>{currentIndex < communications.length - 1 ? 'Próxima Mensagem' : 'Ciente, fechar'}</span>
            {currentIndex < communications.length - 1 ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

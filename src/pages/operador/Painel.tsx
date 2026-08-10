import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import { ClipboardCheck, Wrench } from 'lucide-react';
import { format } from 'date-fns';

export default function Painel() {
  const navigate = useNavigate();
  const [presencaCount, setPresencaCount] = useState(0);
  const [presencaTime, setPresencaTime] = useState<string | null>(null);

  useEffect(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    api.getPresencas(hoje).then(res => {
      setPresencaCount(res.length);
      if (res.length > 0) {
        const times = res.map(p => new Date(p.photo_taken_at || p.data || new Date().toISOString()).getTime());
        const lastTime = new Date(Math.max(...times));
        setPresencaTime(format(lastTime, 'HH:mm'));
      }
    });
  }, []);

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl shadow-sm text-sm font-medium flex items-center">
        <span className="text-xl mr-3">✅</span>
        <p>A presença de hoje já foi concluída e não pode mais ser alterada.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Card Presença */}
        <div 
          onClick={() => navigate('/operador/presenca')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col active:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Presença</h2>
              <p className="text-green-600 font-medium text-sm flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Concluída
              </p>
            </div>
          </div>
          <div className="text-gray-600 text-sm space-y-1">
            <p><strong>{presencaCount}</strong> funcionários conferidos</p>
            {presencaTime && <p>Finalizada às <strong>{presencaTime}</strong></p>}
          </div>
        </div>

        {/* Card Ferramentas */}
        <div 
          onClick={() => navigate('/operador/ferramentas')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col active:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mr-4">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Controle de Ferramentas</h2>
              <p className="text-gray-500 text-sm">Acessar módulo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

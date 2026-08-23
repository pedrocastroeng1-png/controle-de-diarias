import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package } from 'lucide-react';
import ComprasMateriaisTab from './ComprasMateriaisTab';
import QuantidadeMateriaisTab from './QuantidadeMateriaisTab';

export default function ControleMateriais() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [activeTab, setActiveTab] = useState('compras');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          Controle de Materiais
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('compras')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${activeTab === 'compras' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Cadastro de Compras
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('quantidade')}
                  className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${activeTab === 'quantidade' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Quantidade
                </button>
                <button
                  onClick={() => setActiveTab('relatorios')}
                  className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${activeTab === 'relatorios' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Relatórios
                </button>
              </>
            )}
          </nav>
        </div>
        
        <div className="p-6">
          <div>
            {activeTab === 'compras' && <div className="text-left"><ComprasMateriaisTab /></div>}
            {activeTab === 'quantidade' && isAdmin && <div className="text-left"><QuantidadeMateriaisTab /></div>}
            {activeTab === 'relatorios' && isAdmin && <div className="text-center py-12 text-gray-500"><p>Relatórios de Materiais (Em desenvolvimento)</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, ShoppingCart, FileText, Database, LayoutDashboard, Truck } from 'lucide-react';
import ComprasMateriaisTab from './ComprasMateriaisTab';
import RelatoriosMateriaisTab from './RelatoriosMateriaisTab';
import PainelMateriaisTab from './PainelMateriaisTab';
import FornecedoresTab from './FornecedoresTab';

export default function ControleMateriais() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'painel' : 'compras');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          Gestão e Destinação de Materiais
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex overflow-x-auto">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('painel')}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'painel' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Resumo (Administrativo)
              </button>
            )}
            <button
              onClick={() => setActiveTab('compras')}
              className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'compras' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Entradas (Compras)
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('fornecedores')}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'fornecedores' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Truck className="w-4 h-4" />
                Fornecedores
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('relatorios')}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'relatorios' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Relatórios & Exportação
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6 bg-gray-50/30 min-h-[500px]">
          {activeTab === 'painel' && <PainelMateriaisTab />}
          {activeTab === 'compras' && <ComprasMateriaisTab />}
          {activeTab === 'fornecedores' && <FornecedoresTab />}
          {activeTab === 'relatorios' && isAdmin && <RelatoriosMateriaisTab />}
        </div>
      </div>
    </div>
  );
}

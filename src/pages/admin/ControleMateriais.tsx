import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, ShoppingCart, ArrowRightLeft, FileText, Database } from 'lucide-react';
import ComprasMateriaisTab from './ComprasMateriaisTab';
import EstoqueMateriaisTab from './EstoqueMateriaisTab';
import MovimentacoesMateriaisTab from './MovimentacoesMateriaisTab';
import RelatoriosMateriaisTab from './RelatoriosMateriaisTab';

export default function ControleMateriais() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';
  const [activeTab, setActiveTab] = useState('estoque');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          Controle de Materiais
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('estoque')}
              className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'estoque' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4" />
              Estoque
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'compras' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras
            </button>
            <button
              onClick={() => setActiveTab('movimentacoes')}
              className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'movimentacoes' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Movimentações
            </button>
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
                Relatórios
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6 bg-gray-50/30 min-h-[500px]">
          {activeTab === 'estoque' && <EstoqueMateriaisTab />}
          {activeTab === 'compras' && <ComprasMateriaisTab />}
          {activeTab === 'movimentacoes' && <MovimentacoesMateriaisTab />}
          {activeTab === 'relatorios' && isAdmin && <RelatoriosMateriaisTab />}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Dashboard from './Dashboard';
import ListaFerramentas from './ListaFerramentas';
import Emprestimos from './Emprestimos';
import Emprestadas from './Emprestadas';
import Quebradas from './Quebradas';
import EmReparo from './EmReparo';
import Historico from './Historico';

type Tab = 'dashboard' | 'lista' | 'emprestimos' | 'emprestadas' | 'quebradas' | 'reparo' | 'historico';

export default function FerramentasAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'lista', name: 'Todas as Ferramentas' },
    { id: 'emprestimos', name: 'Novo Empréstimo' },
    { id: 'emprestadas', name: 'Emprestadas' },
    { id: 'quebradas', name: 'Quebradas' },
    { id: 'reparo', name: 'Em Reparo' },
    { id: 'historico', name: 'Histórico' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Controle de Ferramentas</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`
                  whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'lista' && <ListaFerramentas />}
        {activeTab === 'emprestimos' && <Emprestimos />}
        {activeTab === 'emprestadas' && <Emprestadas />}
        {activeTab === 'quebradas' && <Quebradas />}
        {activeTab === 'reparo' && <EmReparo />}
        {activeTab === 'historico' && <Historico />}
      </div>
    </div>
  );
}

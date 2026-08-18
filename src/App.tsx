/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminLayout, OperadorLayout } from './components/layout/Layout';

import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import Obras from './pages/admin/Obras';
import Funcoes from './pages/admin/Funcoes';
import Funcionarios from './pages/admin/Funcionarios';
import FerramentasAdmin from './pages/admin/Ferramentas';
import FerramentaDetalhes from './pages/admin/Ferramentas/FerramentaDetalhes';
import Relatorios from './pages/admin/Relatorios';
import Automations from './pages/admin/Automations';

import Atestados from './pages/admin/Atestados';
import Communications from './pages/admin/Communications';
import CentralComunicacoes from './pages/admin/CentralComunicacoes';

import AuditoriaPresencas from './pages/admin/AuditoriaPresencas';
import PresencaPage from './pages/operador/Presenca';
import PainelOperador from './pages/operador/Painel';
import FerramentasOperador from './pages/operador/Ferramentas';

import { AppUpdater } from './components/AppUpdater';
import { ErrorBoundary } from './components/ErrorBoundary';
import Debug from './pages/debug/Debug';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppUpdater>
          <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="obras" element={<Obras />} />
              <Route path="funcoes" element={<Funcoes />} />
              <Route path="funcionarios" element={<Funcionarios />} />
              <Route path="ferramentas" element={<FerramentasAdmin />} />
              <Route path="ferramentas/:id" element={<FerramentaDetalhes />} />
              <Route path="presenca" element={<PresencaPage />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="automacoes" element={<Automations />} />
              <Route path="atestados" element={<Atestados />} />
              <Route path="comunicacoes" element={<Communications />} />
              <Route path="central-comunicacoes" element={<CentralComunicacoes />} />

              <Route path="auditoria" element={<AuditoriaPresencas />} />
            </Route>

            {/* Operator Routes */}
            <Route path="/operador" element={<OperadorLayout />}>
              <Route index element={<Navigate to="/operador/painel" replace />} />
              <Route path="painel" element={<PainelOperador />} />
              <Route path="ferramentas" element={<FerramentasOperador />} />
              <Route path="presenca" element={<PresencaPage />} />
            </Route>
            
            <Route path="/debug" element={<Debug />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </ErrorBoundary>
        </AppUpdater>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

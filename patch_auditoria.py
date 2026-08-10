import re

with open('src/pages/admin/AuditoriaPresencas.tsx', 'r') as f:
    content = f.read()

# Add state and context for MEIA DIARIA
if 'const [togglingMeiaDiaria, setTogglingMeiaDiaria] = useState(false);' not in content:
    content = content.replace(
        'const [modalOpen, setModalOpen] = useState(false);',
        'const [modalOpen, setModalOpen] = useState(false);\n  const [togglingMeiaDiaria, setTogglingMeiaDiaria] = useState(false);\n  const { user } = useAuth();'
    )
    content = content.replace(
        "import { Search, Loader2, Camera, Calendar, Clock, User, CheckCircle2, ChevronDown } from 'lucide-react';",
        "import { Search, Loader2, Camera, Calendar, Clock, User, CheckCircle2, ChevronDown, DollarSign } from 'lucide-react';\nimport { useAuth } from '../../contexts/AuthContext';"
    )

# Add toggle handler
handler = """
  const handleToggleMeiaDiaria = async (presenca: Presenca) => {
    if (!user) return;
    const isMeia = presenca.meia_diaria;
    const actionText = isMeia ? 'reverter meia diária para diária normal' : 'transformar em meia diária';
    const funcRate = presenca.funcionario?.funcao?.valor_diaria || 0;
    const newRate = isMeia ? funcRate : funcRate / 2;
    
    if (!window.confirm(`Confirmar ${actionText}?\n\nO valor desta diária será ajustado para ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newRate)}.`)) {
      return;
    }
    
    try {
      setTogglingMeiaDiaria(true);
      await api.toggleMeiaDiaria(presenca.id, !isMeia, user.id);
      
      // Update local state
      const updatedPresencas = presencas.map(p => 
        p.id === presenca.id ? { ...p, meia_diaria: !isMeia } : p
      );
      setPresencas(updatedPresencas);
      setSelectedPresenca({ ...presenca, meia_diaria: !isMeia });
      alert('Operação realizada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao alterar meia diária: ${err.message}`);
    } finally {
      setTogglingMeiaDiaria(false);
    }
  };
"""

if 'handleToggleMeiaDiaria' not in content:
    content = content.replace(
        '  async function loadFuncionarios() {',
        handler + '\n  async function loadFuncionarios() {'
    )

# Add button to the modal
button_jsx = """
                      {/* Actions */}
                      <div className="md:col-span-2 flex justify-center mt-4 pt-4 border-t border-gray-100">
                        {user?.perfil === 'ADMIN' && selectedPresenca?.presente && (
                          <button
                            onClick={() => handleToggleMeiaDiaria(selectedPresenca)}
                            disabled={togglingMeiaDiaria}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPresenca.meia_diaria ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {selectedPresenca.meia_diaria ? 'Reverter para Diária Normal' : 'Transformar em Meia Diária'}
                          </button>
                        )}
                      </div>
"""
if '{/* Actions */}' not in content:
    content = content.replace(
        '                    </div>\n                    \n                  </div>',
        '                    </div>\n' + button_jsx + '\n                  </div>'
    )

with open('src/pages/admin/AuditoriaPresencas.tsx', 'w') as f:
    f.write(content)

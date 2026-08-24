const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const target = `                </label>
                <button
                  onClick={() => {
                    setCameraModalFuncId(null);
                    setPreviewPhoto(null);
                  }}`;

const replacement = `                </label>
                {isAdmin && (
                  <button
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        if (isAdmin && savedRecords[cameraModalFuncId]) {
                           const now = new Date().toISOString();
                           await api.salvarPresencas([{
                              funcionario_id: cameraModalFuncId,
                              obra_id: funcionarios.find(f => f.id === cameraModalFuncId)?.obra_id,
                              data: selectedDate,
                              presente: true,
                              photo_taken_at: now,
                              photo_taken_by: usuario?.id || null
                           }]);
                           showToast('✅ Presença registrada sem foto!', 'success');
                        } else {
                           setPresencas(prev => ({ ...prev, [cameraModalFuncId]: true }));
                           setSavedSuccess(false);
                        }
                        
                        setCameraModalFuncId(null);
                        setPreviewPhoto(null);
                      } catch (err: any) {
                        setErro(err.message || 'Erro ao processar');
                        showToast('❌ Erro ao processar', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="mt-4 w-full px-4 py-4 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition shadow-sm"
                  >
                    Registrar Sem Foto
                  </button>
                )}
                <button
                  onClick={() => {
                    setCameraModalFuncId(null);
                    setPreviewPhoto(null);
                  }}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/operador/Presenca.tsx', code);
  console.log("Button patched successfully.");
} else {
  console.log("Could not find the target string.");
}

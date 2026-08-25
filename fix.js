const fs = require('fs');
let content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const regex = /onClick=\{async \(\) => \{\n\s*setSaving\(true\);\n\s*let uploadedPhotoPath = null;[\s\S]*?\}\n\s*\}\}\n\s*setCameraModalFuncId\(null\);[\s\S]*?className="flex justify-center items-center/;

const replacement = `onClick={async () => {
                    setSaving(true);
                    let uploadedPhotoPath = null;

                    try {
                      // If it's a replacement (already saved), update immediately
                      if (isAdmin && savedRecords[cameraModalFuncId]) {
                        const now = new Date().toISOString();
                        const photo_path = await api.uploadAttendancePhoto(
                          previewPhoto.file,
                          cameraModalFuncId,
                          Date.now().toString(36)
                        );
                        uploadedPhotoPath = photo_path;
                        await api.salvarPresencas([
                          {
                            funcionario_id: cameraModalFuncId,
                            obra_id: funcionarios.find(
                              (f) => f.id === cameraModalFuncId,
                            )?.obra_id,
                            data: selectedDate,
                            presente: true,
                            photo_path,
                            photo_taken_at: now,
                            photo_taken_by: usuario?.id || null,
                          },
                        ]);
                        showToast(
                          "✅ Foto substituída com sucesso!",
                          "success",
                        );
                      } else {
                        // Standard flow: just save to state for bulk submission
                        setCapturedFotos((prev) => ({
                          ...prev,
                          [cameraModalFuncId]: previewPhoto.file,
                        }));
                        setPresencas((prev) => ({
                          ...prev,
                          [cameraModalFuncId]: true,
                        }));
                        setSavedSuccess(false);
                      }
                      setCameraModalFuncId(null);
                      setPreviewPhoto(null);
                    } catch (err: any) {
                      if (uploadedPhotoPath) {
                        await api.deleteAttendancePhotos([uploadedPhotoPath]).catch(() => {});
                      }
                      setErro(err.message || "Erro ao processar foto");
                      showToast("❌ Erro ao processar foto", "error");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="flex justify-center items-center`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/operador/Presenca.tsx', content);
console.log('Fixed');

const fs = require('fs');
let content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

// Replace handleConfirmSalvar
const regex1 = /const handleConfirmSalvar = async \(\) => \{[\s\S]*?\/\/ showToast\('✅ Presença registrada com sucesso!', 'success'\);\n    \} catch \(error: any\) \{\n      setErro\(\n        error\.message \|\| "Ocorreu um erro ao salvar a lista de presenças\.",\n      \);\n    \} finally \{\n      setSaving\(false\);\n    \}\n  \};/;

const newHandle = `const handleConfirmSalvar = async () => {
    setShowConfirm(false);
    setSaving(true);
    setErro("");
    const uploadedPaths: string[] = [];

    try {
      const now = new Date().toISOString();
      const userId = usuario?.id || null;
      const operationId = Date.now().toString(36);

      const pendingFuncionarios = funcionarios.filter(
        (f) => !atestadosAtivos[f.id] && presencas[f.id] !== undefined
      );

      for (const f of pendingFuncionarios) {
        if (presencas[f.id] === true) {
          if (!isAdmin && !capturedFotos[f.id]) {
            throw new Error(\`Falta foto de presença para \${f.nome}\`);
          }
        }
      }

      const registrosToSave = await Promise.all(
        pendingFuncionarios.map(async (f) => {
          let photo_path = undefined;
          let photo_taken_at = undefined;
          let photo_taken_by = undefined;

          if (presencas[f.id] === true && capturedFotos[f.id]) {
            photo_path = await api.uploadAttendancePhoto(
              capturedFotos[f.id],
              f.id,
              operationId
            );
            uploadedPaths.push(photo_path);
            photo_taken_at = now;
            photo_taken_by = userId;
          }

          return {
            funcionario_id: f.id,
            obra_id: f.obra_id,
            data: selectedDate,
            presente: presencas[f.id],
            ...(photo_path && { photo_path, photo_taken_at, photo_taken_by }),
          };
        })
      );

      await api.salvarPresencas(registrosToSave);

      const presencasData = await api.getPresencas(selectedDate);
      const newSavedRecords: Record<string, boolean> = {};
      const newPresencasMap: Record<string, boolean | undefined> = {
        ...presencas,
      };
      const newFullPresencas: Record<string, any> = { ...fullPresencas };
      presencasData.forEach((p) => {
        newPresencasMap[p.funcionario_id] = p.presente;
        newSavedRecords[p.funcionario_id] = true;
        newFullPresencas[p.funcionario_id] = p;
      });

      const missingRecords = registrosToSave.filter(
        (r) => !newSavedRecords[r.funcionario_id]
      );
      if (missingRecords.length > 0) {
        throw new Error("Alguns registros não foram persistidos corretamente. A operação foi abortada.");
      }

      const ativosEsperados = funcionarios.filter(
        (f) => !atestadosAtivos[f.id],
      );
      let todosIdentificados = true;
      ativosEsperados.forEach((f) => {
        if (newPresencasMap[f.id] === undefined) {
          todosIdentificados = false;
        }
      });

      if (presencasData.length > 0) {
        setTemRegistros(true);
        if (!isAdmin && todosIdentificados) {
          setJaRegistradoHoje(true);
        } else {
          setJaRegistradoHoje(false);
        }
      }

      setPresencas(newPresencasMap);
      setSavedRecords(newSavedRecords);
      setFullPresencas(newFullPresencas);

      setSavedSuccess(true);
    } catch (error: any) {
      if (uploadedPaths.length > 0) {
        await api.deleteAttendancePhotos(uploadedPaths).catch(() => {});
      }
      setErro(
        error.message || "Ocorreu um erro ao salvar a lista de presenças.",
      );
    } finally {
      setSaving(false);
    }
  };`;

content = content.replace(regex1, newHandle);

const regex2 = /<button\n\s*disabled=\{saving\}\n\s*onClick=\{async \(\) => \{\n\s*setSaving\(true\);\n\n\s*try \{\n\s*\/\/ If it's a replacement[\s\S]*?\} finally \{\n\s*setSaving\(false\);\n\s*\}\n\s*\}\}\n\s*>/;

const newButton = `<button
                  disabled={saving}
                  onClick={async () => {
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
                >`;

content = content.replace(regex2, newButton);

fs.writeFileSync('src/pages/operador/Presenca.tsx', content);

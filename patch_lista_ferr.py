import re

with open('src/pages/admin/Ferramentas/ListaFerramentas.tsx', 'r') as f:
    content = f.read()

old_submit = """      const data = {
        codigo_interno: codigoInterno,
        nome,
        marca,
        modelo,
        observacoes,
      };

      if (editId) {
        await api.updateFerramenta(editId, data, foto, removeFoto, usuario!.id);
      } else {
        await api.createFerramenta(data, foto, usuario!.id);
      }"""

new_submit = """      const data: any = {
        codigo_interno: codigoInterno,
        nome,
        marca,
        modelo,
        observacoes,
      };

      if (removeFoto) {
        data.foto_path = null;
      } else if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = await api.uploadPhoto('ferramentas-fotos', foto, fileName);
        if (filePath) {
           data.foto_path = filePath;
        }
      }

      if (editId) {
        await api.updateFerramenta(editId, data, usuario!.id);
      } else {
        await api.createFerramenta(data, usuario!.id);
      }"""

if old_submit in content:
    content = content.replace(old_submit, new_submit)
else:
    print("old_submit not found")

content = content.replace("await api.updateFerramenta(f.id, { status: 'ATIVA' }, null, false, usuario!.id);", "await api.updateFerramenta(f.id, { status: 'ATIVA' }, usuario!.id);")

with open('src/pages/admin/Ferramentas/ListaFerramentas.tsx', 'w') as f:
    f.write(content)


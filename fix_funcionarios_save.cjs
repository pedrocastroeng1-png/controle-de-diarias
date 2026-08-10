const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf-8');

// The submit looks like this:
// const created = await api.createFuncionario({ nome, funcao_id: funcaoId, obra_id: obraId });
// Let's replace it
code = code.replace(/api\.createFuncionario\(\{ nome, funcao_id: funcaoId, obra_id: obraId \}\)/g, `api.createFuncionario({ nome, funcao_id: funcaoId, obra_id: obraId, tipo_colaborador: tipoColaborador })`);

// And update:
// await api.updateFuncionario(editId, { nome, funcao_id: funcaoId, obra_id: obraId });
code = code.replace(/api\.updateFuncionario\(editId, \{ nome, funcao_id: funcaoId, obra_id: obraId \}\)/g, `api.updateFuncionario(editId, { nome, funcao_id: funcaoId, obra_id: obraId, tipo_colaborador: tipoColaborador })`);

fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
console.log('Fixed API calls in Funcionarios');

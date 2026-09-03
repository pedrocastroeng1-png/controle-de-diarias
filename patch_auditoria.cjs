const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf8');

// The original lines:
// const activeFuncs = funcData
//   .filter(f => f.ativo)
//   .sort((a, b) => a.nome.localeCompare(b.nome));
// 
// setFuncionarios(activeFuncs);
// setFilteredFuncionarios(activeFuncs);

// We will change `setFuncionarios(activeFuncs)` to `setFuncionarios(funcData.sort((a,b)=>a.nome.localeCompare(b.nome)))`
// No, I need a state `activeFuncionarios` for the Quadro.

const patchCode = `      const activeFuncs = funcData
        .filter(f => f.ativo)
        .sort((a, b) => a.nome.localeCompare(b.nome));

      const allFuncs = funcData.sort((a, b) => a.nome.localeCompare(b.nome));

      setFuncionarios(allFuncs);
      setFilteredFuncionarios(allFuncs);`;
      
code = code.replace(`      const activeFuncs = funcData
        .filter(f => f.ativo)
        .sort((a, b) => a.nome.localeCompare(b.nome));

      setFuncionarios(activeFuncs);
      setFilteredFuncionarios(activeFuncs);`, patchCode);

// Then in useMemo:
// const employeesInTree = funcionarios.filter(f => allObraIds.includes(f.obra_id));
// Replace with `funcionarios.filter(f => f.ativo && allObraIds.includes(f.obra_id))`

code = code.replace(`const employeesInTree = funcionarios.filter(f => allObraIds.includes(f.obra_id));`, `const employeesInTree = funcionarios.filter(f => f.ativo && allObraIds.includes(f.obra_id));`);

code = code.replace(`const emps = funcionarios.filter(f => f.obra_id === sub.id);`, `const emps = funcionarios.filter(f => f.ativo && f.obra_id === sub.id);`);

fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', code);

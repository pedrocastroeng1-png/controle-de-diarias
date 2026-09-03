const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

code = code.replace(
  /let funcs: Funcionario\[\] = \[\];\n\s*try \{\n\s*funcs = await api\.getFuncionarios\("ativos", true\);\n\s*setFuncionarios\(funcs\);\n\s*\} catch \(error\) \{\n\s*setErro\("Ocorreu um erro ao carregar a lista de funcionários\."\);\n\s*setLoading\(false\);\n\s*return;\n\s*\}/m,
  `let funcsRaw: Funcionario[] = [];
    try {
      funcsRaw = await api.getFuncionarios("todos", true);
    } catch (error) {
      setErro("Ocorreu um erro ao carregar a lista de funcionários.");
      setLoading(false);
      return;
    }`
);

// Now we need to modify how `funcs` is derived from `presencasData`
// But wait, `presencasData` is fetched AFTER `api.getFuncionarios`. Let's reorder them.


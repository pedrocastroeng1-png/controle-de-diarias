import re

with open('src/pages/operador/Presenca.tsx', 'r') as f:
    code = f.read()

old_code = """    setLoading(true);
    setSavedSuccess(false);
    setErro("");

    let funcs: Funcionario[] = [];
    try {
      funcs = await api.getFuncionarios("ativos", true);
      setFuncionarios(funcs);
    } catch (error) {
      setErro("Ocorreu um erro ao carregar a lista de funcionários.");
      setLoading(false);
      return;
    }

    try {
      const presencasData = await api.getPresencas(selectedDate);"""

new_code = """    setLoading(true);
    setSavedSuccess(false);
    setErro("");

    let funcsRaw: Funcionario[] = [];
    let presencasData: any[] = [];
    try {
      funcsRaw = await api.getFuncionarios("todos", true);
      presencasData = await api.getPresencas(selectedDate);
      
      const presencasIds = new Set(presencasData.map((p) => p.funcionario_id));
      
      const funcs = funcsRaw.filter(f => {
        if (presencasIds.has(f.id)) return true;
        
        if (f.data_admissao && selectedDate < f.data_admissao) return false;
        
        if (!f.ativo) {
            if (f.data_desligamento && selectedDate > f.data_desligamento) return false;
            if (!f.data_desligamento) return false;
        }
        
        return true;
      });
      setFuncionarios(funcs);
    } catch (error) {
      setErro("Ocorreu um erro ao carregar os dados.");
      setLoading(false);
      return;
    }

    try {"""

code = code.replace(old_code, new_code)

with open('src/pages/operador/Presenca.tsx', 'w') as f:
    f.write(code)


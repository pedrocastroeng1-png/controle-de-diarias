with open('src/lib/api.ts', 'r') as f:
    code = f.read()

old_code = """    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data as any;
  },"""

new_code = """    const { data, error } = await query;
    if (error) {
      throw error;
    }
    
    const filteredData = (data as any[]).filter((row) => {
      const dataDiaria = new Date(row.data).getTime();
      
      if (row.data_admissao) {
        const admissao = new Date(row.data_admissao).getTime();
        if (dataDiaria < admissao) return false;
      }
      
      if (row.data_desligamento) {
        const desligamento = new Date(row.data_desligamento).getTime();
        if (dataDiaria > desligamento) return false;
      }
      
      return true;
    });

    return filteredData;
  },"""

code = code.replace(old_code, new_code)

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

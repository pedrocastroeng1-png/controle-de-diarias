const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf8');

const targetAgrupar = `        if (!agrupado[fId]) {
          agrupado[fId] = {
            id: p.funcionario_id || fId,
            nome: p.funcionario_nome || p.funcionario || '',
            funcao: p.funcao_nome || p.funcao || '',
            obra: p.obra_nome || p.obra || '',
            dias: 0,
            faltas: 0,
            valorDiaria: Number(p.valor_diaria) || 0,
            total: 0
          };
        }
        
        // Use row's valor_calculado for the exact amount (fallback to valor_diaria if old record)
        const rowValor = Number(p.valor_calculado) || Number(p.valor_diaria) || 0;
        
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO' || p.status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA') {
          // If it's half day, we count as 1 presence but total will be 50%
          agrupado[fId].dias += 1;
          agrupado[fId].total += rowValor;
        } else if (p.status === 'FALTOU') {
          agrupado[fId].faltas += 1;
        }`;

const newAgrupar = `        if (!agrupado[fId]) {
          const funcBase = funcionariosBase.find(f => f.id === (p.funcionario_id || fId)) || funcionariosBase.find(f => f.nome === (p.funcionario_nome || p.funcionario));
          agrupado[fId] = {
            id: p.funcionario_id || fId,
            nome: p.funcionario_nome || p.funcionario || '',
            funcao: p.funcao_nome || p.funcao || '',
            obra: p.obra_nome || p.obra || '',
            dias: 0,
            faltas: 0,
            valorDiaria: funcBase?.tipo_colaborador === 'CLT' ? 0 : (Number(p.valor_diaria) || 0),
            total: 0,
            isCLT: funcBase?.tipo_colaborador === 'CLT'
          };
        }
        
        // Use row's valor_calculado for the exact amount (fallback to valor_diaria if old record)
        let rowValor = Number(p.valor_calculado) || Number(p.valor_diaria) || 0;
        if (agrupado[fId].isCLT) {
           rowValor = 0;
        }
        
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO' || p.status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA') {
          // If it's half day, we count as 1 presence but total will be 50%
          agrupado[fId].dias += 1;
          agrupado[fId].total += rowValor;
        } else if (p.status === 'FALTOU') {
          agrupado[fId].faltas += 1;
        }`;

code = code.replace(targetAgrupar, newAgrupar);
fs.writeFileSync('src/pages/admin/Relatorios.tsx', code);

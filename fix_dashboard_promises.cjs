const fs = require('fs');
let file = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldPromiseAll = `        const [stats, obrasData, presencasHoje, relatorio7d] = await Promise.all([
          api.getDashboardStats(dataStr),
          api.getObras(),
          api.getPresencas(dataStr),
          api.getRelatorio(sevenDaysAgoStr, dataStr)
        ]);
        
        setTotalObras(stats.totalObras);
        setTotalFuncionarios(stats.totalFuncionarios);
        setPresentesHoje(stats.presentesHoje);
        setFaltasHoje(stats.faltasHoje);
        setValorTotalHoje(stats.valorTotalHoje);`;

const newPromiseAll = `        const [statsResult, obrasResult, presencasResult, relatorioResult] = await Promise.allSettled([
          api.getDashboardStats(dataStr),
          api.getObras(),
          api.getPresencas(dataStr),
          api.getRelatorio(sevenDaysAgoStr, dataStr)
        ]);

        const stats = statsResult.status === 'fulfilled' ? statsResult.value : { totalObras: 0, totalFuncionarios: 0, presentesHoje: 0, faltasHoje: 0, valorTotalHoje: 0 };
        const obrasData = obrasResult.status === 'fulfilled' ? obrasResult.value : [];
        const presencasHoje = presencasResult.status === 'fulfilled' ? presencasResult.value : [];
        const relatorio7d = relatorioResult.status === 'fulfilled' ? relatorioResult.value : [];

        setTotalObras(stats.totalObras);
        setTotalFuncionarios(stats.totalFuncionarios);
        setPresentesHoje(stats.presentesHoje);
        setFaltasHoje(stats.faltasHoje);
        setValorTotalHoje(stats.valorTotalHoje);`;

content = content.replace(oldPromiseAll, newPromiseAll);
fs.writeFileSync(file, content);
console.log('Fixed Dashboard.tsx');

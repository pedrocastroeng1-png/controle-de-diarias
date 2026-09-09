with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

old_code = """      distinctDates.forEach(dateStr => {
        const d = parseISO(dateStr);
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getUTCDay()];
        cltColumns.push({ 
          header: `${dayName} - ${format(d, 'dd/MM')}`, 
          key: `date_${dateStr}`, 
          width: 20 
        });
      });"""

new_code = """      distinctDates.forEach(dateStr => {
        const [y, m, day] = dateStr.split('-');
        const d = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day)));
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getUTCDay()];
        cltColumns.push({ 
          header: `${dayName} - ${day}/${m}`, 
          key: `date_${dateStr}`, 
          width: 20 
        });
      });"""

content = content.replace(old_code, new_code)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)

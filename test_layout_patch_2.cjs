const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

const allMenuItemsRegex = /const allMenuItems = \[[\s\S]*?const menuItems = [\s\S]*?: allMenuItems;/;

const newMenuLogic = `
  const adminMenuGroups = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'CADASTROS',
      icon: Briefcase,
      items: [
        { name: 'Obras', path: '/admin/obras' },
        { name: 'Funções', path: '/admin/funcoes' },
        { name: 'Funcionários', path: '/admin/funcionarios' }
      ]
    },
    {
      name: 'DIÁRIAS',
      icon: ClipboardCheck,
      items: [
        { name: 'Presença', path: '/admin/presenca' },
        { name: 'Atestados', path: '/admin/atestados' },
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    },
    {
      name: 'FERRAMENTAS',
      path: '/admin/ferramentas',
      icon: Wrench
    },
    {
      name: 'CONTROLE DE MATERIAIS',
      path: '/admin/controle-materiais',
      icon: Package
    },
    {
      name: 'RESULTADOS',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'COMUNICAÇÕES',
      icon: Megaphone,
      items: [
        { name: 'Central de Comunicações', path: '/admin/central-comunicacoes' },
        { name: 'Automações', path: '/admin/automacoes' }
      ]
    }
  ];

  const consultaMenuGroups = [
    {
      name: 'RESULTADOS',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'DIÁRIAS',
      icon: ClipboardCheck,
      items: [
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    }
  ];

  const menuGroups = usuario.perfil === 'CONSULTA' ? consultaMenuGroups : adminMenuGroups;

  const toggleGroup = (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupName);
    }
  };
`;

layout = layout.replace(allMenuItemsRegex, newMenuLogic);
fs.writeFileSync('src/components/layout/Layout.tsx', layout, 'utf-8');

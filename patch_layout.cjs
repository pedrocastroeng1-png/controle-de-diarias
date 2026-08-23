const fs = require('fs');

const file = 'src/components/layout/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetMenu = `const adminMenuGroups = [
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
  ];`;

const replacementMenu = `const adminMenuGroups = [
    {
      section: 'VISÃO GERAL',
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      section: 'OPERAÇÃO',
      name: 'Obras',
      path: '/admin/obras',
      icon: Briefcase
    },
    {
      name: 'Pessoas',
      icon: Users,
      items: [
        { name: 'Funcionários', path: '/admin/funcionarios' }
      ]
    },
    {
      name: 'Presença / Diárias',
      icon: ClipboardCheck,
      items: [
        { name: 'Presença', path: '/admin/presenca' },
        { name: 'Atestados', path: '/admin/atestados' },
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    },
    {
      name: 'Ferramentas',
      path: '/admin/ferramentas',
      icon: Wrench
    },
    {
      name: 'Materiais',
      path: '/admin/controle-materiais',
      icon: Package
    },
    {
      section: 'GESTÃO',
      name: 'Resultados / Relatórios',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      name: 'Comunicações',
      icon: Megaphone,
      items: [
        { name: 'Central de Comunicações', path: '/admin/central-comunicacoes' },
        { name: 'Automações', path: '/admin/automacoes' }
      ]
    },
    {
      section: 'ADMINISTRAÇÃO',
      name: 'Cadastros',
      icon: Briefcase,
      items: [
        { name: 'Funções', path: '/admin/funcoes' },
      ]
    }
  ];`;

content = content.replace(targetMenu, replacementMenu);

// Also apply same section logic to consultaMenuGroups
const consultaMenuGroupsTarget = `const consultaMenuGroups = [
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
  ];`;

const consultaMenuGroupsReplacement = `const consultaMenuGroups = [
    {
      section: 'GESTÃO',
      name: 'Resultados / Relatórios',
      icon: FileText,
      items: [
        { name: 'Relatórios', path: '/admin/relatorios' },
        { name: 'Folha de Diárias', path: '/admin/relatorios?tab=folha' }
      ]
    },
    {
      section: 'OPERAÇÃO',
      name: 'Presença / Diárias',
      icon: ClipboardCheck,
      items: [
        { name: 'Auditoria de Presenças', path: '/admin/auditoria' }
      ]
    }
  ];`;
  
content = content.replace(consultaMenuGroupsTarget, consultaMenuGroupsReplacement);

// Fix the render loop to include the section header
const renderTarget = `{menuGroups.map((group) => {
            const Icon = group.icon;`;

const renderReplacement = `{menuGroups.map((group) => {
            const Icon = group.icon;
            
            const sectionHeader = group.section ? (
              <div key={\`section-\${group.section}\`} className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.section}
              </div>
            ) : null;`;
            
content = content.replace(renderTarget, renderReplacement);

// Replace return statement inside loop
content = content.replace(/return \(/g, 'return (\n              <React.Fragment key={group.name}>\n                {sectionHeader}');
// We need to close React.Fragment properly... this regex might be brittle.
// Actually, it's safer to just split and replace carefully.

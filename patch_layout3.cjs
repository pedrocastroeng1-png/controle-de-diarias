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
      icon: HardHat
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
        { name: 'Funções', path: '/admin/funcoes' }
      ]
    }
  ];`;

content = content.replace(targetMenu, replacementMenu);

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
      name: 'Auditoria de Presenças',
      path: '/admin/auditoria',
      icon: ClipboardCheck
    }
  ];`;

content = content.replace(consultaMenuGroupsTarget, consultaMenuGroupsReplacement);

const renderTarget = `{menuGroups.map((group) => {
            const Icon = group.icon;`;

const renderReplacement = `{menuGroups.map((group, index) => {
            const Icon = group.icon;
            const isFirstInSection = group.section && (index === 0 || menuGroups[index - 1].section !== group.section);
            const sectionHeader = isFirstInSection ? (
              <div key={\`section-\${group.section}\`} className="mt-6 mb-2 px-3 text-xs font-semibold text-[var(--color-pceg-slate)] tracking-widest uppercase">
                {group.section}
              </div>
            ) : null;`;
            
content = content.replace(renderTarget, renderReplacement);

const renderReturn1 = `return (
                <Link`;
const renderReturn1Replacement = `return (
                <React.Fragment key={group.path || group.name}>
                {sectionHeader}
                <Link`;

content = content.replace(renderReturn1, renderReturn1Replacement);

const renderReturn2 = `return (
              <div key={group.name} className="space-y-1">`;
const renderReturn2Replacement = `return (
              <React.Fragment key={group.name}>
              {sectionHeader}
              <div className="space-y-1">`;
              
content = content.replace(renderReturn2, renderReturn2Replacement);

content = content.replace(/<\/Link>\n              \);/g, '</Link>\n              </React.Fragment>\n              );');
content = content.replace(/<\/div>\n            \);/g, '</div>\n              </React.Fragment>\n            );');

// Change sidebar selection color from blue-50 to gold-50 or navy?
content = content.replace(/bg-blue-50/g, 'bg-[#FDF9F1]'); // Very light gold
content = content.replace(/text-blue-700/g, 'text-[var(--color-pceg-gold)]');

fs.writeFileSync(file, content, 'utf8');
console.log('Layout patched successfully!');

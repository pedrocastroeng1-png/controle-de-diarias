const fs = require('fs');
let content = fs.readFileSync('src/components/layout/OwnerLayout.tsx', 'utf8');

if (!content.includes('/owner/usuarios')) {
  // Need to import Users if not imported
  if (!content.includes('Users,')) {
    content = content.replace('Home,', 'Home, Users,');
  }
  
  content = content.replace(
    "{ name: 'Empresas', path: '/owner/empresas', icon: Building2 },",
    "{ name: 'Empresas', path: '/owner/empresas', icon: Building2 },\n    { name: 'Usuários', path: '/owner/usuarios', icon: Users },"
  );
  
  fs.writeFileSync('src/components/layout/OwnerLayout.tsx', content);
}

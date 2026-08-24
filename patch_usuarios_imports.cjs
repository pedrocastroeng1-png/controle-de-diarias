const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/Usuarios.tsx', 'utf8');

if (!content.includes('User } from')) {
  content = content.replace("Edit } from 'lucide-react'", "Edit, User } from 'lucide-react'");
  fs.writeFileSync('src/pages/owner/Usuarios.tsx', content);
}

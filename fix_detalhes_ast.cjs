const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Ferramentas/FerramentaDetalhes.tsx', 'utf-8');

// I'll just find the place and fix it manually via regex
const target = /<span className=\{\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \$\{STATUS_COLORS\[ferramenta.status as keyof typeof STATUS_COLORS\]\}\`\}>\s*\{ferramenta\.status\.replace\('_', ' '\)\}\s*<\/div>\s*<\/span>\s*<\/div>\s*<div className="mt-6 flex flex-wrap gap-2">/g;

code = code.replace(/<span className=\{\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \$\{STATUS_COLORS\[ferramenta\.status as keyof typeof STATUS_COLORS\]\}\`\}>\s*\{ferramenta\.status\.replace\('_', ' '\)\}\s*<\/div>\s*<\/span>\s*<\/div>\s*<div className="mt-6 flex flex-wrap gap-2">/,
`<span className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \${STATUS_COLORS[ferramenta.status as keyof typeof STATUS_COLORS]}\`}>
                {ferramenta.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">`);

fs.writeFileSync('src/pages/admin/Ferramentas/FerramentaDetalhes.tsx', code);
console.log('Fixed AST');

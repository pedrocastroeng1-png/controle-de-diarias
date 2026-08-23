const fs = require('fs');

let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

layout = layout.replace(
  `<img src="/icons/icone2.png" alt="PCEG" className="h-10 w-10 object-contain" />`,
  `<img src="/icons/icone2.png" alt="" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />`
);

fs.writeFileSync('src/components/layout/Layout.tsx', layout);

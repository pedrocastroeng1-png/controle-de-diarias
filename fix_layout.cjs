const fs = require('fs');
let file = 'src/components/layout/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<img src="/icons/luxo.png" alt="PCEG Logo" className="w-full max-w-[180px] max-h-full object-contain" onError={(e) => { e.currentTarget.style.display = \'none\'; }} />',
  '<img src="/icons/icone2.png" alt="PCEG Logo" className="w-full max-w-[180px] max-h-full object-contain" />'
);

content = content.replace(
  '<img src="/icons/luxo.png" alt="PCEG Logo" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = \'none\'; }} />',
  '<img src="/icons/icone2.png" alt="PCEG Logo" className="h-10 w-auto object-contain" />'
);

fs.writeFileSync(file, content);
console.log('Fixed Layout.tsx');

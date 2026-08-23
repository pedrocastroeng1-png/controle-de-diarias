const fs = require('fs');
let content = fs.readFileSync('src/components/WhatsNewScreen.tsx', 'utf8');

const target = `<div className="flex items-center justify-center mb-6">
            <img src="/icons/icone.png" alt="PCEG" className="h-[80px] w-[80px] object-contain drop-shadow-sm" />
          </div>
          
          <h2 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-2">
            🚀 PCEG
          </h2>`;

const replacement = `<div className="flex items-center justify-center mb-8">
            <img src="/icons/logo.png" alt="PCEG - Pedro Castro Engenharia e Gestão" className="w-[240px] h-auto object-contain drop-shadow-sm" />
          </div>
          
          <h2 className="text-[28px] sm:text-[32px] leading-tight font-extrabold text-[#0F172A] tracking-tight mb-2">
            🚀 Novidades
          </h2>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/WhatsNewScreen.tsx', content, 'utf8');
  console.log("Patched WhatsNew successfully");
} else {
  console.log("Target not found");
}

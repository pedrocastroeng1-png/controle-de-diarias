const fs = require('fs');
let content = fs.readFileSync('src/components/UpdateScreen.tsx', 'utf8');

const target = `<div className="flex items-center justify-center mb-8">
            <img src="/icons/icone.png" alt="PCEG" className="h-[96px] w-[96px] object-contain drop-shadow-sm" />
          </div>`;

const replacement = `<div className="flex items-center justify-center mb-10">
            <img src="/icons/logo.png" alt="PCEG" className="w-[280px] h-auto object-contain drop-shadow-sm" />
          </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/UpdateScreen.tsx', content, 'utf8');
  console.log("Patched UpdateScreen successfully");
} else {
  console.log("Target not found");
}

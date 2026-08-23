const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

// Replace desktop icon container and img
content = content.replace(
  '<div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">\n          <img src="/icons/icone2.png" alt="PCEG Icon" className="w-[100px] md:w-[115px] lg:w-[135px] h-auto object-contain drop-shadow-2xl" />\n        </div>',
  '<div className="relative z-10 -ml-6 -mt-6 -mb-6 animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">\n          <img src="/icons/icone2.png" alt="PCEG Icon" className="w-[180px] md:w-[210px] lg:w-[240px] xl:w-[280px] h-auto object-contain drop-shadow-2xl" />\n        </div>'
);

// Replace mobile icon
content = content.replace(
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-[90px] sm:w-[105px] h-auto object-contain mb-3 drop-shadow-sm" />',
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-[140px] sm:w-[160px] h-auto object-contain -mt-4 -mb-1 drop-shadow-sm" />'
);

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');
console.log("Patched successfully");

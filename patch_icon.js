const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

// Replace desktop icon
content = content.replace(
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain drop-shadow-2xl" />',
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-[100px] md:w-[115px] lg:w-[135px] h-auto object-contain drop-shadow-2xl" />'
);

// Replace mobile icon
content = content.replace(
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-3 drop-shadow-sm" />',
  '<img src="/icons/icone2.png" alt="PCEG Icon" className="w-[90px] sm:w-[105px] h-auto object-contain mb-3 drop-shadow-sm" />'
);

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');
console.log("Patched successfully");

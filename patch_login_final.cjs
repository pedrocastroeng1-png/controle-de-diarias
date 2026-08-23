const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

// Replace desktop icon
const desktopTarget = `<img src="/icons/icone.png" alt="PCEG Icon" className="w-24 h-24 xl:w-32 xl:h-32 object-contain drop-shadow-2xl mb-12" />`;
const desktopReplacement = `<img src="/icons/icone2.png" alt="PCEG Icon" className="w-24 h-24 xl:w-32 xl:h-32 object-contain drop-shadow-2xl mb-12" />`;

if (content.includes(desktopTarget)) {
  content = content.replace(desktopTarget, desktopReplacement);
  console.log("Replaced desktop icon.");
}

// Replace mobile branding
const mobileTarget = `{/* Mobile Branding (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src="/icons/logo.png" alt="PCEG - Pedro Castro Engenharia e Gestão" className="w-[220px] sm:w-[260px] h-auto object-contain mb-8 drop-shadow-md" />
            <div className="w-12 h-1 bg-[#C6922E] mb-2 rounded-full"></div>
          </div>`;

const mobileReplacement = `{/* Mobile & Tablet Branding (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-10">
            <img src="/icons/icone2.png" alt="PCEG Icon" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-5 drop-shadow-sm" style={{ mixBlendMode: 'multiply' }} />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-2">
              PCEG
            </h1>
            <h2 className="text-[#C6922E] text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold mb-6">
              Pedro Castro Engenharia e Gestão
            </h2>
            <div className="w-12 h-1 bg-[#C6922E] rounded-full"></div>
          </div>`;

if (content.includes(mobileTarget)) {
  content = content.replace(mobileTarget, mobileReplacement);
  console.log("Replaced mobile branding.");
} else {
  console.log("Mobile branding not found.");
}

// Fix Mobile Header text centering
const headerTarget = `{/* Login Header */}
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0B1B33] mb-3 tracking-tight">
              Bem-vindo à PCEG
            </h3>
            <p className="text-gray-500 font-medium">
              Acesse sua conta para continuar.
            </p>
          </div>`;

const headerReplacement = `{/* Login Header */}
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0B1B33] mb-2 tracking-tight">
              Bem-vindo à PCEG
            </h3>
            <p className="text-gray-500 font-medium">
              Acesse sua conta para continuar.
            </p>
          </div>`;

if (content.includes(headerTarget)) {
  content = content.replace(headerTarget, headerReplacement);
  console.log("Replaced header spacing.");
}

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');

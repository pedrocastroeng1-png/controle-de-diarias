const fs = require('fs');

let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

// 1. Fix AdminLayout Sidebar Logo & Colors
const oldAdminSidebarTop = `<aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-gray-200">
          <img src="/icons/logo.png" alt="PCEG" className="w-48 h-auto object-contain" />
        </div>`;

const newAdminSidebarTop = `<aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex flex-shrink-0 z-10">
        <div className="h-[80px] flex items-center justify-center px-6 border-b border-gray-100 bg-white">
          <img src="/icons/logo.png" alt="" className="w-full max-w-[160px] h-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>`;

layout = layout.replace(oldAdminSidebarTop, newAdminSidebarTop);

// 2. Fix AdminLayout Sidebar Nav Styles
layout = layout.replace(
  `"flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-[#FDF9F1] text-[var(--color-pceg-gold)]" 
                      : "text-gray-700 hover:bg-gray-100"`,
  `"flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-[#0B1B33] text-white shadow-md" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1B33]"`
);

layout = layout.replace(
  `<Icon className={cn("mr-3 h-5 w-5", isActive ? "text-[var(--color-pceg-gold)]" : "text-gray-400")} />`,
  `<Icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-[#C6922E]" : "text-gray-400 group-hover:text-[#0B1B33]")} />`
);

layout = layout.replace(
  `"w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    hasActiveChild && !isExpanded ? "bg-[#FDF9F1]/50 text-[var(--color-pceg-gold)]" : "text-gray-700 hover:bg-gray-100"`,
  `"w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    hasActiveChild && !isExpanded ? "bg-[#0B1B33]/5 text-[#0B1B33] font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1B33]"`
);

layout = layout.replace(
  `<Icon className={cn("mr-3 h-5 w-5", hasActiveChild && !isExpanded ? "text-[var(--color-pceg-gold)]" : "text-gray-400")} />`,
  `<Icon className={cn("mr-3 h-5 w-5 transition-colors", hasActiveChild && !isExpanded ? "text-[#C6922E]" : "text-gray-400 group-hover:text-[#0B1B33]")} />`
);

layout = layout.replace(
  `className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors",
                        isItemActive
                          ? "bg-[#FDF9F1] text-[var(--color-pceg-gold)] font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}`,
  `className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-all duration-200",
                        isItemActive
                          ? "bg-[#0B1B33] text-white shadow-sm font-medium"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[#0B1B33]"
                      )}`
);

// 3. Fix Section Headers
layout = layout.replace(
  `className="mt-6 mb-2 px-3 text-xs font-semibold text-[var(--color-pceg-slate)] tracking-widest uppercase"`,
  `className="mt-6 mb-2 px-3 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase"`
);

// 4. Fix AdminLayout Mobile Header Logo
const oldAdminMobileHeader = `<header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-3 md:hidden">
          <img src="/icons/icone2.png" alt="PCEG" className="h-10 w-10 object-contain" />
          <h1 className="text-xl font-bold text-[#0B1B33] tracking-tight">PCEG</h1>`;

const newAdminMobileHeader = `<header className="h-[70px] bg-white border-b border-gray-100 flex items-center px-6 gap-3 md:hidden shrink-0 z-10 shadow-sm">
          <img src="/icons/icone2.png" alt="" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1 className="text-lg font-bold text-[#0B1B33] tracking-tight">PCEG</h1>`;

layout = layout.replace(oldAdminMobileHeader, newAdminMobileHeader);

// 5. Fix Admin Bottom Profile Section
const oldAdminProfile = `<div className="p-4 border-t border-gray-200">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
            <div className="flex-1 truncate">
              {usuario.usuario}
              <div className="text-xs text-gray-500 font-normal">Administrador</div>
            </div>
          </div>`;

const newAdminProfile = `<div className="p-4 border-t border-gray-100 bg-slate-50 mt-auto">
          <div className="flex items-center px-3 py-2 text-sm font-bold text-[#0B1B33]">
            <div className="flex-1 min-w-0">
              <div className="truncate">{usuario.usuario}</div>
              <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Administrador</div>
            </div>
          </div>`;

layout = layout.replace(oldAdminProfile, newAdminProfile);

// 6. Fix Operador Mobile Headers (Both of them)
layout = layout.replace(
  /<img src="\/icons\/icone2\.png" alt="Logo" className="h-8 w-8 object-contain" \/>/g,
  `<img src="/icons/icone2.png" alt="" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />`
);

fs.writeFileSync('src/components/layout/Layout.tsx', layout);
console.log("Patched Layout.tsx styles and logo");

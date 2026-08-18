const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

const navRegex = /<nav className="flex-1 px-4 py-6 space-y-2">[\s\S]*?<\/nav>/;
const newNav = `<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuGroups.map((group) => {
            const Icon = group.icon;
            if (group.path) {
              const isActive = location.pathname.startsWith(group.path);
              return (
                <Link
                  key={group.path}
                  to={group.path}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                  {group.name}
                </Link>
              );
            }

            const isExpanded = expandedGroup === group.name;
            const hasActiveChild = group.items?.some(item => 
              item.path.includes('?') 
                ? location.pathname + location.search === item.path
                : location.pathname.startsWith(item.path.split('?')[0])
            );

            return (
              <div key={group.name} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    hasActiveChild && !isExpanded ? "bg-blue-50/50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn("mr-3 h-5 w-5", hasActiveChild && !isExpanded ? "text-blue-700" : "text-gray-400")} />
                    {group.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && group.items && (
                  <div className="pl-11 pr-3 space-y-1 py-1">
                    {group.items.map(item => {
                      const isItemActive = item.path.includes('?') 
                        ? location.pathname + location.search === item.path
                        : location.pathname === item.path;
                        
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "block px-3 py-2 rounded-md text-sm transition-colors",
                            isItemActive 
                              ? "bg-blue-50 text-blue-700 font-medium" 
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>`;

layout = layout.replace(navRegex, newNav);
fs.writeFileSync('src/components/layout/Layout.tsx', layout, 'utf-8');

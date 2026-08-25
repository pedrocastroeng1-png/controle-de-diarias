const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const newWithEmpresa = `const withEmpresa = (query: any, isAuth = false) => {
  const empId = getEmpresaId();
  if (empId && !isAuth) {
    if (typeof query.eq !== "function") {
      return new Proxy(query, {
        get(target, prop) {
          if (["select", "update", "delete"].includes(prop as string)) {
            return (...args: any[]) => {
              const filterBuilder = (target as any)[prop](...args);
              return filterBuilder.eq("empresa_id", empId);
            };
          }
          return (target as any)[prop];
        },
      });
    }
    return query.eq("empresa_id", empId);
  }
  return query;
};`;

code = code.replace(
  /const withEmpresa = \(query: any, isAuth = false\) => \{[\s\S]*?return query;\n\};/m,
  newWithEmpresa
);

fs.writeFileSync('src/lib/api.ts', code);

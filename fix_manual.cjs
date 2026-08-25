const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const regex = /await withEmpresa\(\s*(supabase\.from\([^)]+\)\.(?:select|update|delete|insert)\([^)]*\)(?:\}[^)]*)?)\s*,?\s*\)\.(eq|lte|gte|order|or|not|in)\(([^)]+)\)/g;

code = code.replace(
  /await withEmpresa\(\s*(supabase\.from\([^)]+\)\.(?:select|update|delete|insert)\([\s\S]*?\))\s*,?\s*\)\.(eq|lte|gte|order|or|not|in)\(([^)]+)\);/g,
  (match, p1, p2, p3) => {
    return `await withEmpresa(${p1}.${p2}(${p3}));`;
  }
);

// We need to run it a few times for chained methods
for(let i=0; i<3; i++) {
  code = code.replace(
    /await withEmpresa\(\s*(supabase\.from\([^)]+\)\.[\s\S]*?)\s*,?\s*\)\.(eq|lte|gte|order|or|not|in)\(([^)]+)\)/g,
    (match, p1, p2, p3) => {
      // make sure we don't accidentally match something else.
      // But it's pretty safe if it starts with `await withEmpresa`
      return `await withEmpresa(${p1}.${p2}(${p3}))`;
    }
  );
}

fs.writeFileSync('src/lib/api.ts', code);

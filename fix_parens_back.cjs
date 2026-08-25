const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// We want to replace `await withEmpresa( X ).eq( Y );` with `await withEmpresa( X.eq( Y ) );`
// We'll just run this replacement multiple times until it doesn't change, to handle chained calls.

let prevCode = '';
while (prevCode !== code) {
  prevCode = code;
  // Match `await withEmpresa( ... ) \n .method(...)`
  // We need to match matching parentheses for `withEmpresa()`. It's hard with regex.
  // Instead, let's match `\)\.(eq|lte|gte|order|or|not|in)\(([^)]*)\)` if it's preceded by `withEmpresa`? No, it could be `query.eq`.
  
  // Actually, I can just replace `),` or `)` before `.eq` if it's closing `withEmpresa`.
  // Let's just fix the known instances from `npm run lint`. I have them!
}

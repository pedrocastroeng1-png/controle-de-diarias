const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// The best way to fix this is to find `await withEmpresa(` and remove the `await` keyword, assigning it to a variable, then do `await` at the end.
// Since it's too complex for automated regex, I'll print the lines where `await withEmpresa` is followed by chained methods after the closing parenthesis of `withEmpresa` or `from()`.

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('await withEmpresa') && (lines[i].includes(').eq(') || lines[i+1]?.includes('.eq(') || lines[i+1]?.includes('.lte(') || lines[i+1]?.includes('.order(') || lines[i+1]?.includes('.or(') || lines[i+1]?.includes('.not(') || lines[i+1]?.includes('.in(') || lines[i+1]?.includes('.limit(') || lines[i+1]?.includes('.single()'))) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    if (lines[i+1]) console.log(`  ${lines[i+1]}`);
    if (lines[i+2]) console.log(`  ${lines[i+2]}`);
  }
}

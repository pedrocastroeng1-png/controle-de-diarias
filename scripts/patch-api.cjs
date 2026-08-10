const fs = require('fs');

let apiFile = fs.readFileSync('src/lib/api.ts', 'utf8');

// Replace requires
apiFile = apiFile.replace(/require\('\.\/supabase'\)\.supabase/g, 'supabase');

// Also the previous patch missed a comma if I replaced `};` which is the end of the object.
// Wait, the error is TS1005: ',' expected. Let's find line 280.
fs.writeFileSync('src/lib/api.ts', apiFile);

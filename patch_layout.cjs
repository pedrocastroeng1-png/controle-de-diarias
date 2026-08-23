const fs = require('fs');

let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

// Replace /icons/icone.png with /icons/icone2.png globally
layout = layout.replace(/\/icons\/icone\.png/g, '/icons/icone2.png');

fs.writeFileSync('src/components/layout/Layout.tsx', layout);
console.log("Patched Layout.tsx");

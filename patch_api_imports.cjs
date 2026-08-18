const fs = require('fs');

let content = fs.readFileSync('src/lib/api.ts', 'utf-8');

if (!content.includes('AutomationRule')) {
  content = content.replace(
    /import {([^}]+)} from '\.\/types';/,
    "import {$1, AutomationRule, AutomationEventCatalog, AutomationRun} from './types';"
  );
  fs.writeFileSync('src/lib/api.ts', content, 'utf-8');
  console.log("Patched api.ts imports");
}

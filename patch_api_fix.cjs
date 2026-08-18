const fs = require('fs');

let content = fs.readFileSync('src/lib/api.ts', 'utf-8');

// Fix comma
content = content.replace(/}\s*\/\/\s*Automations/, '},\n  // Automations');

// Fix imports
if (!content.includes('AutomationRule')) {
  content = content.replace(
    /import {([^}]+)} from '\.\/types';/,
    "import {$1, AutomationRule, AutomationEventCatalog, AutomationRun} from './types';"
  );
}

// Fix isMock if it doesn't exist
if (content.includes('if (isMock)')) {
  if (!content.includes('const isMock =')) {
    // If isMock is not defined globally, let's just remove the if (isMock) lines from automations
    content = content.replace(/if \(isMock\)[^\n]*\n/g, '');
  }
}

fs.writeFileSync('src/lib/api.ts', content, 'utf-8');

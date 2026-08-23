const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

content = content.replace(
  "import { Loader2, User, Lock, ArrowRight, Building2, Users, Package, LineChart } from 'lucide-react';",
  "import { Loader2, User, Lock, ArrowRight, Building2, Users, Package, LineChart, MonitorDown, CheckCircle2 } from 'lucide-react';\nimport { usePWAInstall } from '../../hooks/usePWAInstall';"
);

fs.writeFileSync('src/pages/auth/Login.tsx', content);

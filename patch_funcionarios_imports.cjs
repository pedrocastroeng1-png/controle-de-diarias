const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

code = code.replace(
  "import { Edit2, Ban, Plus, RefreshCcw } from 'lucide-react';",
  "import { Edit2, Ban, Plus, RefreshCcw, CheckSquare, Square, Check, X } from 'lucide-react';"
);

code = code.replace(
  "const [editId, setEditId] = useState<string | null>(null);",
  `const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMassEdit, setShowMassEdit] = useState(false);
  const [massEditObraId, setMassEditObraId] = useState('');
  const [massEditSaving, setMassEditSaving] = useState(false);`
);

fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);

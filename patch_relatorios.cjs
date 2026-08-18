const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf-8');

if (!code.includes('useLocation')) {
  code = code.replace(
    "import { format, parseISO } from 'date-fns';",
    "import { format, parseISO } from 'date-fns';\nimport { useLocation } from 'react-router-dom';"
  );
  
  code = code.replace(
    "export default function Relatorios() {",
    "export default function Relatorios() {\n  const location = useLocation();"
  );
  
  code = code.replace(
    "const [viewMode, setViewMode] = useState<'relatorios' | 'pagamentos'>('relatorios');",
    "const [viewMode, setViewMode] = useState<'relatorios' | 'pagamentos'>(location.search.includes('tab=folha') ? 'pagamentos' : 'relatorios');"
  );
  
  // Add a useEffect to listen for location changes
  const useEffectInsert = `  useEffect(() => {
    loadObras();
    loadRelatorio('', '', '');
  }, []);`;
  
  code = code.replace(
    useEffectInsert,
    `  useEffect(() => {
    if (location.search.includes('tab=folha')) {
      setViewMode('pagamentos');
    } else {
      setViewMode('relatorios');
    }
  }, [location.search]);\n\n` + useEffectInsert
  );
}

fs.writeFileSync('src/pages/admin/Relatorios.tsx', code, 'utf-8');

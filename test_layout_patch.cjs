const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

// Ensure new icons are imported
if (!layout.includes('ChevronDown')) {
  layout = layout.replace(
    "import { ClipboardCheck, LogOut, Wrench, LayoutDashboard, HardHat, Briefcase, Users, FileText, Stethoscope, Megaphone, Camera, Bell } from 'lucide-react';",
    "import { ClipboardCheck, LogOut, Wrench, LayoutDashboard, HardHat, Briefcase, Users, FileText, Stethoscope, Megaphone, Camera, Bell, ChevronDown, ChevronRight, Package } from 'lucide-react';"
  );
}

// Add state to AdminLayout
if (!layout.includes('const [expandedGroup, setExpandedGroup]')) {
  layout = layout.replace(
    "const [loadingComms, setLoadingComms] = useState(true);",
    "const [loadingComms, setLoadingComms] = useState(true);\n  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);"
  );
}

fs.writeFileSync('src/components/layout/Layout.tsx', layout, 'utf-8');

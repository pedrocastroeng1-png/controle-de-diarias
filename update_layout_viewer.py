import sys

with open('src/components/layout/Layout.tsx', 'r') as f:
    code = f.read()

import_viewer = "import { CentralCommunicationViewer } from '../CentralCommunicationViewer';\n"
if "CentralCommunicationViewer" not in code:
    code = code.replace("import { CommunicationViewer } from '../CommunicationViewer';", "import { CommunicationViewer } from '../CommunicationViewer';\n" + import_viewer)

if "const [unreadCentralComms, setUnreadCentralComms] = useState<any[]>([]);" not in code:
    code = code.replace("const [unreadComms, setUnreadComms] = useState<any[]>([]);", "const [unreadComms, setUnreadComms] = useState<any[]>([]);\n  const [unreadCentralComms, setUnreadCentralComms] = useState<any[]>([]);")

if "api.getUnreadCentralCommunications(usuario.id)," not in code:
    code = code.replace("api.getUnreadCommunications(usuario.id),", "api.getUnreadCommunications(usuario.id),\n        api.getUnreadCentralCommunications(usuario.id),")

if "const [comms, presencas] = await Promise.all(" not in code:
    code = code.replace("]).then(([comms, presencas]) => {", "]).then(([comms, centralComms, presencas]) => {\n        setUnreadCentralComms(centralComms);")

# We need to render CentralCommunicationViewer if unreadCentralComms > 0
render_viewer = """
  if (unreadCentralComms.length > 0) {
    return <CentralCommunicationViewer communications={unreadCentralComms} onComplete={() => setUnreadCentralComms([])} />;
  }
"""
if "unreadCentralComms.length > 0" not in code:
    code = code.replace("if (unreadComms.length > 0) {", render_viewer + "  if (unreadComms.length > 0) {")

with open('src/components/layout/Layout.tsx', 'w') as f:
    f.write(code)

print("Layout updated with CentralCommunicationViewer")

import re

with open('src/pages/operador/Presenca.tsx', 'r') as f:
    content = f.read()

# Add import
import_code = "import { compressImage } from '../../lib/imageUtils';\n"
if "compressImage" not in content:
    content = content.replace("import { useAuth } from '../../contexts/AuthContext';", import_code + "import { useAuth } from '../../contexts/AuthContext';")

# Apply compression to setPreviewPhoto
# Search for:
# const file = e.target.files?.[0];
# if (file) {
#   setPreviewPhoto({

replacement = """const file = e.target.files?.[0];
                        if (file) {
                          compressImage(file).then(compressedFile => {
                            setPreviewPhoto({
                              file: compressedFile,
                              url: URL.createObjectURL(compressedFile)
                            });
                          }).catch(err => {
                            console.error('Erro na compressão:', err);
                            setPreviewPhoto({ file, url: URL.createObjectURL(file) });
                          });
                        }"""

# regex replace
content = re.sub(r'const file = e\.target\.files\?\.\[0\];\s*if\s*\(file\)\s*\{\s*setPreviewPhoto\(\{\s*file,\s*url:\s*URL\.createObjectURL\(file\)\s*\}\);\s*\}', replacement, content)

with open('src/pages/operador/Presenca.tsx', 'w') as f:
    f.write(content)


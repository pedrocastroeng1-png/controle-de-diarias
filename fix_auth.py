import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("    // 1. Limpar estado local imediatamente\n imediatamente (sem await) para feedback visual instantâneo", "    // 1. Limpar estado local imediatamente (sem await) para feedback visual instantâneo")

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)

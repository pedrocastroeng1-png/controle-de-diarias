import re

with open('src/pages/debug/Debug.tsx', 'r') as f:
    content = f.read()

content = content.replace("src={logo}", "src=\"/logo.png\"")

with open('src/pages/debug/Debug.tsx', 'w') as f:
    f.write(content)

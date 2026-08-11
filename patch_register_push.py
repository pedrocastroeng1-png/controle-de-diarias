import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace(".eq('token', token).single();", ".eq('token', token).maybeSingle();")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)


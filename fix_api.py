with open('src/lib/api.ts', 'r') as f:
    lines = f.readlines()
    
# check if last lines have missing braces
if lines[-1].strip() == '};':
    if 'update({ ativo })' in lines[-2]:
        # missing closing brace for toggleFornecedorStatus
        lines.insert(-1, '  }\n')

with open('src/lib/api.ts', 'w') as f:
    f.writelines(lines)

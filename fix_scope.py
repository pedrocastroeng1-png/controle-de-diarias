with open('src/pages/operador/Presenca.tsx', 'r') as f:
    code = f.read()

code = code.replace("let funcsRaw: Funcionario[] = [];", "let funcsRaw: Funcionario[] = [];\n    let funcs: Funcionario[] = [];")
code = code.replace("const funcs = funcsRaw.filter(f => {", "funcs = funcsRaw.filter(f => {")

with open('src/pages/operador/Presenca.tsx', 'w') as f:
    f.write(code)

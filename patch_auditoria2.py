import re

with open('src/pages/admin/AuditoriaPresencas.tsx', 'r') as f:
    content = f.read()

# Replace <span className="bg-green-100 text-green-800 ...">Presente</span>
old_tag = """<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Presente
                              </span>"""
new_tag = """{p.meia_diaria ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Meia Diária
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Presente
                                </span>
                              )}"""

content = content.replace(old_tag, new_tag)

with open('src/pages/admin/AuditoriaPresencas.tsx', 'w') as f:
    f.write(content)

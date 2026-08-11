import re

with open('src/pages/admin/CentralComunicacoes.tsx', 'r') as f:
    content = f.read()

old_header = """                <h3 className="font-bold text-gray-900 text-lg">{h.title}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                </span>"""
# wait, in my grep it showed {h.titulo}
# let's grep for it

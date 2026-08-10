import sys

with open('src/components/layout/Layout.tsx', 'r') as f:
    code = f.read()

# Replace max-w-md with max-w-5xl md:max-w-5xl or just remove it for main container.
# Wait, let's just make it max-w-md md:max-w-5xl
code = code.replace(
    'className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col pb-24"',
    'className="flex-1 max-w-md md:max-w-5xl w-full mx-auto p-4 flex flex-col pb-24"'
)
code = code.replace(
    'className="max-w-md w-full mx-auto px-4 h-16 flex items-center justify-between"',
    'className="max-w-md md:max-w-5xl w-full mx-auto px-4 h-16 flex items-center justify-between"'
)
code = code.replace(
    'className="max-w-md mx-auto flex h-16"',
    'className="max-w-md md:max-w-5xl mx-auto flex h-16"'
)
code = code.replace(
    'className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col"',
    'className="flex-1 max-w-md md:max-w-5xl w-full mx-auto p-4 flex flex-col"'
)

with open('src/components/layout/Layout.tsx', 'w') as f:
    f.write(code)

print("Layout updated")

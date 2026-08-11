import json

with open('tsconfig.json', 'r') as f:
    data = json.load(f)

data['exclude'] = ["android", "dist", "node_modules"]

with open('tsconfig.json', 'w') as f:
    json.dump(data, f, indent=2)


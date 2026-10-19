import json

def find_socket(node, path):
    if 'socket.io-client' in node.get('name', ''):
        print(f"Found socket in: {path} -> {node.get('name')} size {node.get('size')}")
    for child in node.get('children', []):
        find_socket(child, path + [node.get('name', '')])

with open('stats.json', 'r') as f:
    data = json.load(f)

for child in data.get('tree', data).get('children', []):
    find_socket(child, [child.get('name')])

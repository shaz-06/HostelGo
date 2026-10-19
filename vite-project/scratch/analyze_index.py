import json

with open('stats.json') as f:
    data = json.load(f)

def print_tree(node, indent=""):
    name = node.get("name", "")
    size = node.get("size", 0)
    print(f"{indent}{name}: {size / 1024:.2f} KB")
    # Only go 2 levels deep inside node_modules
    if "node_modules" in name and indent == "  ":
        for child in sorted(node.get("children", []), key=lambda x: x.get("size", 0), reverse=True)[:10]:
            print(f"{indent}  {child.get('name')}: {child.get('size', 0) / 1024:.2f} KB")
        return
    if indent == "":
        for child in sorted(node.get("children", []), key=lambda x: x.get("size", 0), reverse=True):
            print_tree(child, indent + "  ")

for chunk in data.get("tree", data).get("children", []):
    if chunk.get("name", "").startswith("assets/index-"):
        print_tree(chunk)
        break

import re

with open("src/App.jsx") as f:
    content = f.read()

use_effects = re.findall(r'(useEffect\(\(\) => \{.*?\}\, \[.*?\]\);)', content, re.DOTALL)
print(f"Found {len(use_effects)} useEffects")

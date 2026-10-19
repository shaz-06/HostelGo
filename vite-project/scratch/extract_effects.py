import re

with open("src/App.jsx", "r") as f:
    lines = f.readlines()

in_effect = False
effect_start = 0
brace_count = 0
effects = []

for i, line in enumerate(lines):
    if "useEffect(() => {" in line:
        in_effect = True
        effect_start = i
        brace_count = line.count("{") - line.count("}")
        continue
    
    if in_effect:
        brace_count += line.count("{") - line.count("}")
        
        if brace_count == 0 and "}, [" in line or "}, []);" in line or "});" in line:
            in_effect = False
            effects.append({
                "start": effect_start,
                "end": i,
                "code": "".join(lines[effect_start:i+1])
            })

for idx, e in enumerate(effects):
    # Only print first line and last line to see deps
    lines = e['code'].split("\n")
    print(f"Effect {idx+1} [Lines {e['start']}-{e['end']}]:")
    print("  " + lines[1][:100] + "...") if len(lines)>1 else None
    print("  " + lines[-2][:100])

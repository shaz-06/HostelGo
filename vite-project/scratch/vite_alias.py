import re

def instrument(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Add alias to vite config
    alias_str = """
      'react-dom/client': 'react-dom/profiling',
      'react-dom': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
"""
    if "alias: {" in content:
        content = content.replace("alias: {", "alias: {" + alias_str)
    
    with open(file_path, "w") as f:
        f.write(content)

instrument("vite.config.js")

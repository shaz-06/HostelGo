import re

def instrument(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Add Profiler import
    if "import { Profiler }" not in content:
        content = content.replace('import React', 'import React, { Profiler }', 1)
        if "import { Profiler }" not in content:
            content = 'import { Profiler } from "react";\n' + content

    # Add onRender callback
    callback = """
window.__onRenderCallback = function(id, phase, actualDuration, baseDuration, startTime, commitTime) {
    console.log(`[Profiler] ${id} | Phase: ${phase} | Actual: ${actualDuration.toFixed(2)}ms | Base: ${baseDuration.toFixed(2)}ms`);
};
"""
    if "window.__onRenderCallback" not in content:
        content = content.replace("export default function App() {", callback + "\nexport default function App() {")

    # Wrap MobileHome
    content = re.sub(
        r'(<MobileHome)([\s\S]*?)(\/>)',
        r'<Profiler id="MobileHome" onRender={window.__onRenderCallback}>\1\2\3</Profiler>',
        content
    )

    with open(file_path, "w") as f:
        f.write(content)

instrument("src/App.jsx")

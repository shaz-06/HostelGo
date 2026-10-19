import re

def instrument(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Wrap AppContent usage
    content = re.sub(
        r'(<AppContent.*?/\>)',
        r'<Profiler id="AppContent" onRender={window.__onRenderCallback}>\1</Profiler>',
        content
    )

    with open(file_path, "w") as f:
        f.write(content)

instrument("src/App.jsx")

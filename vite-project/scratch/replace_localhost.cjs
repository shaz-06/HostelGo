const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('http://localhost:8000')) {
        console.log("Replacing in:", filePath);
        
        // Replace exact matches first
        content = content.replace(/"http:\/\/localhost:8000"/g, 'window.API_BASE_URL');
        content = content.replace(/'http:\/\/localhost:8000'/g, 'window.API_BASE_URL');
        content = content.replace(/`http:\/\/localhost:8000`/g, 'window.API_BASE_URL');

        // Replace prefix matches
        content = content.replace(/"http:\/\/localhost:8000/g, 'window.API_BASE_URL + "');
        content = content.replace(/'http:\/\/localhost:8000/g, "window.API_BASE_URL + '");
        content = content.replace(/`http:\/\/localhost:8000/g, 'window.API_BASE_URL + `');
        
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

walkDir(srcDir);
console.log("Replaced all localhost references successfully!");

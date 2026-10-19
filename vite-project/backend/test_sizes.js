const http = require('http');

function measureSize(url, label) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const sizeInKB = (Buffer.byteLength(data, 'utf8') / 1024).toFixed(2);
        console.log(`${label}: ${sizeInKB} KB`);
        resolve(sizeInKB);
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
      resolve(null);
    });
  });
}

async function run() {
  await measureSize("http://localhost:8000/api/home", "/api/home");
  await measureSize("http://localhost:8000/api/category/fresh-vegetables", "/api/category/:slug");
  await measureSize("http://localhost:8000/api/products?search=milk", "/api/products");
}

run();

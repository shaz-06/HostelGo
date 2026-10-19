const http = require("http");

const measureTime = async (url) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve(Date.now() - start);
      });
    }).on("error", reject);
  });
};

const run = async () => {
  try {
    // 1st request is cache miss
    const homeMiss = await measureTime("http://localhost:8000/api/home");
    console.log(`/api/home Cache-MISS latency: ${homeMiss}ms`);
    
    // 2nd request is cache hit
    const homeHit = await measureTime("http://localhost:8000/api/home");
    console.log(`/api/home Cache-HIT latency: ${homeHit}ms`);

    // 1st request is cache miss
    const catMiss = await measureTime("http://localhost:8000/api/category/fresh-vegetables");
    console.log(`/api/category/:slug Cache-MISS latency: ${catMiss}ms`);

    // 2nd request is cache hit
    const catHit = await measureTime("http://localhost:8000/api/category/fresh-vegetables");
    console.log(`/api/category/:slug Cache-HIT latency: ${catHit}ms`);

  } catch (err) {
    console.error(err);
  }
};

run();

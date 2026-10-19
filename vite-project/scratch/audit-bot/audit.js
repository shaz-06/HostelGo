const { chromium } = require('playwright');
const fs = require('fs');

async function runScenario(context, url, runs, scenarioName) {
  let stats = {
    lcp: [],
    cls: [],
    ttfb: [],
    fcp: [],
    domContentLoaded: [],
    loadEvent: [],
    totalRequests: [],
    totalBytes: [],
    apiRequests: [],
    apiLatency: [],
    reactRenders: [],
    duplicateApiRequests: [],
  };

  for (let i = 0; i < runs; i++) {
    console.log(`Running ${scenarioName} - Run ${i + 1}/${runs}...`);
    const page = await context.newPage();
    let requests = [];
    
    page.on('request', req => {
      requests.push({
        url: req.url(),
        method: req.method(),
        type: req.resourceType(),
        time: Date.now()
      });
    });

    let reactLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.startsWith('[Profiler]')) {
        reactLogs.push(text);
      }
    });

    await page.goto(url, { waitUntil: 'load' });
    
    // Wait a bit for JS to settle and LCP
    await page.waitForTimeout(3000);

    const perfData = await page.evaluate(() => {
      const paintStats = performance.getEntriesByType('paint');
      const navStats = performance.getEntriesByType('navigation')[0];
      const clsEntries = performance.getEntriesByType('layout-shift');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      
      let cls = 0;
      for (const entry of clsEntries) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
      const fcp = paintStats.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      
      return {
        domContentLoaded: navStats.domContentLoadedEventEnd,
        loadEvent: navStats.loadEventEnd,
        ttfb: navStats.responseStart,
        fcp,
        lcp,
        cls
      };
    });

    stats.lcp.push(perfData.lcp);
    stats.cls.push(perfData.cls);
    stats.ttfb.push(perfData.ttfb);
    stats.fcp.push(perfData.fcp);
    stats.domContentLoaded.push(perfData.domContentLoaded);
    stats.loadEvent.push(perfData.loadEvent);

    let apiReqs = requests.filter(r => r.url.includes('/api/') || r.type === 'fetch' || r.type === 'xhr');
    stats.totalRequests.push(requests.length);
    stats.apiRequests.push(apiReqs.length);
    
    // Check duplicates
    let urls = apiReqs.map(r => r.url);
    let duplicates = urls.length - new Set(urls).size;
    stats.duplicateApiRequests.push(duplicates);

    stats.reactRenders.push(reactLogs);

    await page.close();
  }

  return stats;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const url = 'http://localhost:4173';
  
  // Scenario A: Guest
  const guestContext = await browser.newContext();
  const guestStats = await runScenario(guestContext, url, 3, "Guest");
  
  // Scenario B: Returning User (Auth)
  const authContext = await browser.newContext();
  await authContext.addInitScript(() => {
    window.localStorage.setItem('token', 'dummy_token');
    window.localStorage.setItem('user', JSON.stringify({
      _id: "u123",
      firstName: "Test",
      lastName: "User",
      phoneNumber: "+1234567890",
      roles: ["customer"]
    }));
  });
  const authStats = await runScenario(authContext, url, 3, "Returning User");
  
  fs.writeFileSync('audit-results.json', JSON.stringify({ guestStats, authStats }, null, 2));
  await browser.close();
  console.log("Audit complete. Results saved to audit-results.json");
})();

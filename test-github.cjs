const https = require('https');

https.get('https://api.github.com/repos/ziggemma1/aether-study-app/git/trees/main?recursive=1', {
  headers: { 'User-Agent': 'NodeJS' }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.tree) {
        console.log("ALL FILES IN GITHUB MAIN BRANCH:");
        data.tree.filter(t => t.type === 'blob').sort((a,b) => a.path.localeCompare(b.path)).forEach(t => console.log(t.path));
      } else {
        console.log("No tree", data);
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', console.error);

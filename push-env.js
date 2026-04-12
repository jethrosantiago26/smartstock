const fs = require('fs');
const { spawnSync } = require('child_process');

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const line of lines) {
  if (line.trim() && line.includes('=')) {
    let [key, ...rest] = line.split('=');
    key = key.trim();
    let val = rest.join('=').replace(/^"|"$/g, '').trim();
    if (key && val) {
       console.log('Pushing ' + key + ' to Vercel...');
       // Use vercel CLI to add the variable. It reads prompt input from stdin
       spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], { 
         input: val, 
         encoding: 'utf-8',
         stdio: ['pipe', 'inherit', 'inherit'] 
       });
    }
  }
}

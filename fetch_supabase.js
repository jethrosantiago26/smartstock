const fs = require('fs');

const token = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_346ac13b37c346241ed1e36b2d3b4fe470a8447b';
const ref = 'yhydxddmmdweupkswybo';

async function main() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keys = await res.json();
  const anon = keys.find(k => k.name === 'anon').api_key;
  const service = keys.find(k => k.name === 'service_role').api_key;
  
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_SERVICE_ROLE_KEY=${service}
SUPABASE_ACCESS_TOKEN=${token}
`;
  
  fs.writeFileSync('.env.local', envContent, 'utf-8');
  console.log('Environment variables successfully configured!');
}

main().catch(console.error);

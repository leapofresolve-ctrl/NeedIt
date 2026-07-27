import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const url=env.NEXT_PUBLIC_SUPABASE_URL, anon=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const res = await fetch(url+'/rest/v1/', { headers: { apikey: anon, Authorization: 'Bearer '+anon }});
const spec = await res.json();
const p = spec.definitions?.profiles;
if(!p){console.log('no profiles definition; top-level keys:', Object.keys(spec).slice(0,10)); process.exit(0);}
console.log('profiles columns:');
for(const [col, d] of Object.entries(p.properties||{})){
  const req = (p.required||[]).includes(col);
  console.log(`  ${col}: ${d.format||d.type}${d.default!==undefined?' default='+JSON.stringify(d.default):''}${req?'  [REQUIRED]':''}`);
}

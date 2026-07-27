import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const sk = env.STRIPE_SECRET_KEY;
if(!sk){console.log('no STRIPE_SECRET_KEY'); process.exit(0);}
try {
  const res = await fetch('https://api.stripe.com/v1/accounts?limit=10', { headers: { Authorization: 'Bearer '+sk }});
  const j = await res.json();
  if(j.error){console.log('stripe error:', j.error.message); process.exit(0);}
  for(const a of j.data||[]){
    console.log('acct', a.id, '| business:', a.business_profile?.name || a.email || '(none)',
      '| details_submitted:', a.details_submitted,
      '| payouts_enabled:', a.payouts_enabled,
      '| transfers:', a.capabilities?.transfers);
  }
} catch(e){ console.log('FETCH FAILED:', e.cause?.code || e.message); }

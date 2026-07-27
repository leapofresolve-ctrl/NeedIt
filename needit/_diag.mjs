import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const url=env.NEXT_PUBLIC_SUPABASE_URL, key=env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.log('MISSING url or service key in .env.local'); process.exit(0);}
const admin=createClient(url,key,{auth:{persistSession:false}});
const { data:list, error:e1 } = await admin.auth.admin.listUsers({page:1,perPage:200});
if(e1){console.log('auth list error:', e1.message); process.exit(0);}
console.log('total auth users:', list.users.length);
for(const u of list.users){
  const { data:prof } = await admin.from('profiles').select('id, username, email_notifications').eq('id', u.id).maybeSingle();
  console.log('-', u.email, '| profile row:', prof? ('YES username='+JSON.stringify(prof.username)) : 'MISSING');
}

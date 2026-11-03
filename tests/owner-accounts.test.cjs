const {test}=require('node:test'),assert=require('node:assert/strict');
test('account deletion requires a fresh owner identity, typed target email and unprotected target',async()=>{
 const {ownerAccountHandler}=await import('../supabase/functions/owner-accounts/handler.mjs');
 const calls=[],target='00000000-0000-4000-ab00-000000000001';let owner=true,protectedUser=false,files=true;
 const handler=ownerAccountHandler({url:'https://auth.example.invalid',key:'public-key',serviceKey:'private-server-key',fetcher:async(url,opts)=>{
  calls.push({url,opts});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner',email_confirmed_at:'2026-11-01T00:00:00Z',user_metadata:{role:'founder'}});
  if(url.endsWith('/is_founder'))return Response.json(owner);
  if(url.endsWith('/owner_accounts'))return Response.json({users:[{id:target,email:'student@example.invalid',protected:protectedUser}]});
  if(url.endsWith('/object/list/logos')){assert.equal(JSON.parse(opts.body).prefix,target+'/');const result=files?[{id:'logo-id',name:'logo.webp'}]:[];files=false;return Response.json(result);}
  if(url.endsWith('/object/logos')){assert.deepEqual(JSON.parse(opts.body).prefixes,[target+'/logo.webp']);return Response.json({});}
  if(url.endsWith('/admin/users/'+target))return Response.json({});
  throw Error('unexpected request');
 }});
 const call=(email='student@example.invalid',user=target)=>handler(new Request('https://auth.example.invalid/functions/v1/owner-accounts',{method:'POST',headers:{Origin:'https://deutschklinik.com',Authorization:'Bearer caller'},body:JSON.stringify({user_id:user,confirm_email:email})}));
 owner=false;assert.equal((await call()).status,403);assert.equal(calls.some(c=>c.opts.headers.apikey==='private-server-key'),false);
 owner=true;protectedUser=true;assert.equal((await call()).status,403);
 protectedUser=false;assert.equal((await call('wrong@example.invalid')).status,400);assert.equal(calls.some(c=>c.opts.method==='DELETE'),false);
 assert.equal((await call()).status,200);
 assert.ok(calls.some(c=>c.url.endsWith('/admin/users/'+target)&&c.opts.method==='DELETE'));
 assert.ok(calls.filter(c=>c.url.includes('/rest/')||c.url.endsWith('/auth/v1/user')).every(c=>c.opts.headers.apikey==='public-key'));
});

const {test}=require('node:test'),assert=require('node:assert/strict');
test('learners delete only their own account, after typing its email; founders and school owners with members are refused',async()=>{
 const {deleteAccountHandler}=await import('../supabase/functions/delete-account/handler.mjs');
 const me='00000000-0000-4000-ab00-000000000007';let calls=[],founder=false,orgs=[],members=[],files=true;
 const handler=deleteAccountHandler({url:'https://auth.example.invalid',key:'public-key',serviceKey:'private-server-key',fetcher:async(url,opts={})=>{
  calls.push({url,opts});
  if(url.endsWith('/auth/v1/user'))return opts.headers.Authorization==='Bearer good'?Response.json({id:me,email:'Learner@Example.invalid'}):new Response('{}',{status:401});
  if(url.endsWith('/is_founder'))return Response.json(founder);
  if(url.includes('/rest/v1/orgs?')){assert.ok(url.endsWith('owner=eq.'+me));return Response.json(orgs);}
  if(url.includes('/rest/v1/org_members?')){assert.ok(url.includes('user_id=neq.'+me));return Response.json(members);}
  if(url.endsWith('/object/list/logos')){assert.equal(JSON.parse(opts.body).prefix,me+'/');const r=files?[{id:'f',name:'logo.webp'}]:[];files=false;return Response.json(r);}
  if(url.endsWith('/object/logos')){assert.deepEqual(JSON.parse(opts.body).prefixes,[me+'/logo.webp']);return Response.json({});}
  if(url.endsWith('/admin/users/'+me))return Response.json({});
  throw Error('unexpected request '+url);
 }});
 const call=({email='learner@example.invalid',token='good',headers={'X-Deutschklinik-Client':'ios/1.0'}}={})=>handler(new Request('https://auth.example.invalid/functions/v1/delete-account',{method:'POST',headers:{Authorization:'Bearer '+token,...headers},body:JSON.stringify({email})}));
 const deleted=()=>calls.some(c=>c.opts.method==='DELETE'&&c.url.includes('/admin/users/'));
 assert.equal((await call({headers:{}})).status,403);                                   // no Origin, no app header
 assert.equal((await call({headers:{Origin:'https://evil.example','X-Deutschklinik-Client':'ios/1.0'}})).status,403);
 assert.equal((await call({token:'stale'})).status,401);
 assert.equal((await call({email:'other@example.invalid'})).status,400);
 assert.equal(calls.some(c=>c.opts.headers?.apikey==='private-server-key'),false);       // nothing privileged before the checks
 founder=true;assert.equal((await call()).status,403);founder=false;
 orgs=[{id:'00000000-0000-4000-ab00-0000000000aa'}];members=[{user_id:'someone'}];assert.equal((await call()).status,409);
 assert.equal(deleted(),false);
 members=[];const ok=await call({headers:{Origin:'https://deutschklinik.com'}});
 assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{deleted:true});assert.ok(deleted());
});

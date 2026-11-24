// Learners and teachers delete their own account (App Store 5.1.1(v), Google Play). The caller's live identity
// is checked on every call; the service key stays inside this function and is used only for the caller's own
// pictures and the caller's own auth user. Founder accounts can't be deleted here, and a school owner whose
// school still has other members must hand it over or close it first, because deleting the owner deletes the
// school for everyone in it.
//
// POST /functions/v1/delete-account   Authorization: Bearer <access token>   {"email": "<the account's email>"}
//   200 {"deleted":true} · 400 email doesn't match · 401 signed out · 403 founder · 409 school with members
//
// Allowed callers: the site's own pages (by Origin) and the native apps (no Origin, X-Deutschklinik-Client: ios/… or
// android/…). Browsers can't send that header from another site without a CORS preflight, which this refuses.
export function deleteAccountHandler({url,key,serviceKey,fetcher=fetch}){
  const allowed=['https://deutschklinik.com','https://www.deutschklinik.com','https://edwink-ug.github.io'];
  return async request=>{
    const origin=request.headers.get('Origin')||'';
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
    const answer=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(request.method==='OPTIONS')return answer(200,{});
    const nativeApp=!origin&&/^(ios|android)\/[0-9A-Za-z.\-]{1,20}$/.test(request.headers.get('X-Deutschklinik-Client')||'');
    if(!allowed.includes(origin)&&!nativeApp)return answer(403,{error:'Forbidden origin.'});
    if(request.method!=='POST')return answer(405,{error:'POST only.'});
    const authorization=request.headers.get('Authorization')||'';
    if(!/^Bearer \S+$/i.test(authorization))return answer(401,{error:'Please sign in again.'});
    try{
      const callerHeaders={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
      const verified=await fetcher(url+'/auth/v1/user',{headers:callerHeaders});
      if(!verified.ok)return answer(401,{error:'Please sign in again.'});
      const caller=await verified.json(),id=caller?.id;
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||''))return answer(401,{error:'Please sign in again.'});
      const body=await request.json().catch(()=>null);
      if(typeof body?.email!=='string'||!caller.email||body.email.trim().toLowerCase()!==caller.email.toLowerCase())return answer(400,{error:'Type your account’s email address to confirm.'});
      const founder=await fetcher(url+'/rest/v1/rpc/is_founder',{method:'POST',headers:callerHeaders,body:'{}'});
      if(!founder.ok)return answer(503,{error:'Account service temporarily unavailable. Please retry.'});
      if(await founder.json()===true)return answer(403,{error:'The site owner’s account can’t be deleted from the app.'});
      const adminHeaders={apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'};
      const owned=await fetcher(url+'/rest/v1/orgs?select=id&owner=eq.'+id,{headers:adminHeaders});
      if(!owned.ok)return answer(503,{error:'Account service temporarily unavailable. Please retry.'});
      const orgs=(await owned.json()).map(o=>o.id).filter(x=>/^[0-9a-f-]{36}$/i.test(String(x)));
      if(orgs.length){
        const others=await fetcher(url+'/rest/v1/org_members?select=user_id&limit=1&user_id=neq.'+id+'&org_id=in.('+orgs.join(',')+')',{headers:adminHeaders});
        if(!others.ok)return answer(503,{error:'Account service temporarily unavailable. Please retry.'});
        if((await others.json()).length)return answer(409,{error:'You run a school that still has members. Hand it over or close it on deutschklinik.com first.'});
      }
      // Supabase refuses deleting users who still own Storage objects; the only user-owned bucket is logos.
      for(let page=0;page<100;page++){
        const list=await fetcher(url+'/storage/v1/object/list/logos',{method:'POST',headers:adminHeaders,body:JSON.stringify({prefix:id+'/',limit:100,offset:0})});
        if(!list.ok)return answer(503,{error:'Could not check your pictures. Nothing has been deleted.'});
        const files=await list.json();if(!files.length)break;
        if(files.some(f=>!f.id||typeof f.name!=='string'||f.name.includes('/')))return answer(409,{error:'Your account has pictures that need the site owner’s help to remove. Please write to us.'});
        const remove=await fetcher(url+'/storage/v1/object/logos',{method:'DELETE',headers:adminHeaders,body:JSON.stringify({prefixes:files.map(f=>id+'/'+f.name)})});
        if(!remove.ok)return answer(503,{error:'Could not remove your pictures. Please retry.'});
        if(page===99)return answer(409,{error:'Too many pictures to remove at once. Please retry.'});
      }
      // Deleting the auth user cascades its sessions, identities and every table keyed to it.
      const result=await fetcher(url+'/auth/v1/admin/users/'+id,{method:'DELETE',headers:adminHeaders,body:JSON.stringify({should_soft_delete:false})});
      if(!result.ok)return answer(503,{error:'Your account could not be deleted. Please retry.'});
      return answer(200,{deleted:true});
    }catch{return answer(503,{error:'Account service temporarily unavailable. Please retry.'});}
  };
}

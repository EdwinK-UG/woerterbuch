// Service credentials are confined to this function. Every operation rechecks
// the caller's live identity and the database owner list, not JWT metadata.
export function ownerAccountHandler({url,key,serviceKey,fetcher=fetch}){
  const allowed=['https://deutschklinik.com','https://www.deutschklinik.com','https://edwink-ug.github.io'];
  return async request=>{
    const origin=request.headers.get('Origin')||'';
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
    const answer=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(request.method==='OPTIONS')return answer(200,{});
    if(!allowed.includes(origin))return answer(403,{error:'Forbidden origin.'});
    if(request.method!=='POST')return answer(405,{error:'POST only.'});
    const authorization=request.headers.get('Authorization')||'';
    if(!/^Bearer \S+$/i.test(authorization))return answer(401,{error:'Sign in again.'});
    try{
      const callerHeaders={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
      const verified=await fetcher(url+'/auth/v1/user',{headers:callerHeaders});
      if(!verified.ok)return answer(401,{error:'Sign in again.'});
      const caller=await verified.json();if(!caller.id||!caller.email_confirmed_at)return answer(403,{error:'Confirm your email first.'});
      const owner=await fetcher(url+'/rest/v1/rpc/is_founder',{method:'POST',headers:callerHeaders,body:'{}'});
      if(!owner.ok||await owner.json()!==true)return answer(403,{error:'Only the site owner can delete accounts.'});
      const body=await request.json().catch(()=>null),id=body?.user_id;
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')||id===caller.id)return answer(400,{error:'Choose another account.'});
      const impactResponse=await fetcher(url+'/rest/v1/rpc/owner_accounts',{method:'POST',headers:callerHeaders,body:JSON.stringify({p_user:id})});
      if(!impactResponse.ok)return answer(503,{error:'Account details unavailable.'});
      const target=(await impactResponse.json()).users?.[0];
      if(!target)return answer(404,{error:'Account no longer exists.'});
      if(target.protected)return answer(403,{error:'Owner accounts are protected.'});
      if(typeof body.confirm_email!=='string'||body.confirm_email.trim().toLowerCase()!==target.email?.toLowerCase())return answer(400,{error:'Type the account email to confirm deletion.'});
      const adminHeaders={apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'};
      // Supabase refuses deleting users who still own Storage objects. The only
      // user-owned bucket in this app is logos; only this user's folder is removed.
      for(let page=0;page<100;page++){
        const list=await fetcher(url+'/storage/v1/object/list/logos',{method:'POST',headers:adminHeaders,body:JSON.stringify({prefix:id+'/',limit:100,offset:0})});
        if(!list.ok)return answer(503,{error:'Could not check account pictures. Nothing has been deleted from the account.'});
        const files=await list.json();if(!files.length)break;
        if(files.some(f=>!f.id||typeof f.name!=='string'||f.name.includes('/')))return answer(409,{error:'This account has nested storage. Contact the site administrator before deleting it.'});
        const remove=await fetcher(url+'/storage/v1/object/logos',{method:'DELETE',headers:adminHeaders,body:JSON.stringify({prefixes:files.map(f=>id+'/'+f.name)})});
        if(!remove.ok)return answer(503,{error:'Could not remove account pictures. Please retry.'});
        if(page===99)return answer(409,{error:'Too many pictures to remove in one request. Please retry.'});
      }
      // Auth deletion cascades sessions, identities and app data. The app's
      // sensitive APIs always perform a fresh /user check or a database lookup.
      const result=await fetcher(url+'/auth/v1/admin/users/'+id,{method:'DELETE',headers:adminHeaders,body:JSON.stringify({should_soft_delete:false})});
      if(!result.ok)return answer(503,{error:'The account could not be deleted. Please retry.'});
      return answer(200,{deleted:true});
    }catch{return answer(503,{error:'Account service temporarily unavailable. Please retry.'});}
  };
}

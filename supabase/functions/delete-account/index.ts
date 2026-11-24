import {deleteAccountHandler} from './handler.mjs';
Deno.serve(deleteAccountHandler({url:Deno.env.get('SUPABASE_URL')!,key:Deno.env.get('SUPABASE_ANON_KEY')!,serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}));

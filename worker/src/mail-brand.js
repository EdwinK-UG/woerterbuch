export const LOGO_FOLDER='https://vnnhyhicppkexdibuqyu.supabase.co/storage/v1/object/public/logos/';
export function mailBrand(org={}){
  const colour=/^#[0-9a-f]{6}$/i.test(org.theme||'')?org.theme:'#1f6feb';
  const channels=colour.slice(1).match(/../g).map(v=>{const n=parseInt(v,16)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4});
  const luminance=channels.reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0),light=luminance>.179;
  // Only pictures from the project's own logo folder are embedded in mail: no third-party
  // images or tracking pixels (the database enforces the same rule for stored logos).
  let logo='';try{const u=new URL(org.logo_url);if(u.href.startsWith(LOGO_FOLDER)&&/^[A-Za-z0-9_.\/-]+$/.test(u.pathname)&&!u.search&&!u.hash)logo=u.href;}catch{}
  const contact=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(org.contact_email||'')?org.contact_email:'support@deutschklinik.com';
  return {name:org.name||'Deutschklinik',colour,ink:light?((luminance+.05)/.0638>=4.5?'#14202e':'#000000'):'#ffffff',accent:light?'#655025':colour,logo,contact};
}

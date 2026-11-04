export function mailBrand(org={}){
  const colour=/^#[0-9a-f]{6}$/i.test(org.theme||'')?org.theme:'#252a30';
  const channels=colour.slice(1).match(/../g).map(v=>{const n=parseInt(v,16)/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4});
  const luminance=channels.reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0),light=luminance>.179;
  let logo='';try{const u=new URL(org.logo_url);if(u.protocol==='https:')logo=u.href;}catch{}
  const contact=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(org.contact_email||'')?org.contact_email:'support@deutschklinik.com';
  return {name:org.name||'Deutschklinik',colour,ink:light?((luminance+.05)/.0638>=4.5?'#14202e':'#000000'):'#ffffff',accent:light?'#655025':colour,logo,contact};
}

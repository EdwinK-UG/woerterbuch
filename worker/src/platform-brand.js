// Platform identity for email: the approved Deutschklinik lockup (black D and "Deutsch", blue "klinik").
// PNG for email-client compatibility (784×132 source). Shown at 196×33 when Deutschklinik is the sender;
// beside a school's own name and logo it shrinks to a 120×20 attribution so the school stays first.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PLATFORM_MAIL_LOGO='assets/mail/brand-lockup-mixed.png';
const SIZES={full:[196,33],attribution:[120,20]};
export function platformMailLogo(site='https://deutschklinik.com/',size='full'){
 const [w,h]=SIZES[size]||SIZES.full,url=new URL(PLATFORM_MAIL_LOGO,site);
 return `<img src="${esc(url.href)}" width="${w}" height="${h}" alt="Deutschklinik" style="display:block;width:${w}px;max-width:100%;height:auto;border:0">`;
}
export const isPlatformBrand=brand=>brand.name==='Deutschklinik'&&!brand.logo;
export function mailIdentity(brand,site='https://deutschklinik.com/'){
 if(isPlatformBrand(brand))return platformMailLogo(site);
 return `${brand.logo?`<img src="${esc(brand.logo)}" width="40" height="40" alt="" style="vertical-align:middle;object-fit:contain;margin-right:10px">`:''}<b>${esc(brand.name)}</b><div style="margin-top:12px">${platformMailLogo(site,'attribution')}</div>`;
}

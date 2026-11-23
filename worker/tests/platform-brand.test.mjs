import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mailIdentity,platformMailLogo,PLATFORM_MAIL_LOGO} from '../src/platform-brand.js';
import {mailBrand} from '../src/mail-brand.js';
import {welcomeContent} from '../src/welcome-template.js';
import {invitationContent} from '../src/invitation-template.js';
import {siteInvitationContent} from '../src/invitations.js';
import {verificationContent} from '../src/email-verification.js';
import {messageContent} from '../src/messages.js';
import {announceContent} from '../src/announce.js';
const LOGO=/<img src="https:\/\/deutschklinik\.com\/assets\/mail\/brand-lockup-mixed\.png" width="196" height="33" alt="Deutschklinik" style="[^"]*height:auto[^"]*">/;
const ATTRIBUTION=/<img src="https:\/\/deutschklinik\.com\/assets\/mail\/brand-lockup-mixed\.png" width="120" height="20" alt="Deutschklinik" style="[^"]*height:auto[^"]*">/;
test('every platform email family shows the approved mixed PNG lockup with alt text and proportional size',()=>{
 const site='https://deutschklinik.com/';
 const outputs=[
  ...['learner','teacher','school'].map(role=>welcomeContent(site,{role})),
  invitationContent({course:{name:'A1',level:'A1'},inviteUrl:site}),
  siteInvitationContent(new URL(site+'?invite=0123456789ab'),{role:'teacher',name:'Ada'}),
  siteInvitationContent(new URL(site+'?invite=0123456789ab'),{role:'school'}),
  verificationContent(site,{user_id:'test',token:'sample'}),
  verificationContent(site,{user_id:'test',token:'sample',stage:1}),
  messageContent({subject:'Hi',body:'Hello'}),
  announceContent({design:'news',subject:'Hi',body:'Hello'}),
 ];
 for(const o of outputs){
  assert.match(o.html,LOGO);
  assert.doesNotMatch(o.html,/brand-lockup(?:-blue|-black|-alternating)?\.png/);
  assert.doesNotMatch(o.html,/src="[^"]+\.svg/);
  assert.doesNotMatch(o.html,/Deutsch<span/);
 }
 assert.equal(PLATFORM_MAIL_LOGO,'assets/mail/brand-lockup-mixed.png');
 assert.equal(mailBrand().colour,'#1f6feb','calls to action stay blue');
 assert.match(welcomeContent(site,{role:'learner'}).html,/background:#1f6feb/);
});
test('school identity, colour and safe logo come first, with a smaller platform attribution',()=>{
 const b=mailBrand({name:'School <West>',theme:'#38745a',logo_url:'https://example.com/school.png'}),html=mailIdentity(b);
 assert.equal(b.colour,'#38745a');assert.match(html,/School &lt;West&gt;/);assert.match(html,/https:\/\/example.com\/school.png/);assert.match(html,ATTRIBUTION);assert.doesNotMatch(html,LOGO);
 assert.ok(html.indexOf('School &lt;West&gt;')<html.indexOf('brand-lockup-mixed.png'),'school name before platform logo');
 assert.equal(mailBrand({logo_url:'javascript:alert(1)'}).logo,'');
 const org={name:'Green School',kind:'school',theme:'#28634c'};
 const school=[
  welcomeContent('https://deutschklinik.com/',{role:'learner',org}),
  invitationContent({course:{name:'A1',level:'A1'},org,inviteUrl:'https://deutschklinik.com/'}),
  messageContent({subject:'Hi',body:'Hello',org}),
  verificationContent('https://deutschklinik.com/',{user_id:'u',token:'t',org}),
 ];
 for(const o of school){
  assert.match(o.html,ATTRIBUTION);assert.doesNotMatch(o.html,LOGO);assert.match(o.html,/#28634c/);
  assert.ok(o.html.indexOf('Green School')<o.html.indexOf('brand-lockup-mixed.png'),'school name before platform logo');
 }
 assert.match(platformMailLogo('https://staging.example/'),/https:\/\/staging\.example\/assets\/mail\/brand-lockup-mixed\.png/);
 assert.match(platformMailLogo(undefined,'../bad'),LOGO);
});

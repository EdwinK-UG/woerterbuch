const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const valid = vm.runInNewContext(fs.readFileSync('js/game-messages.js','utf8')+'\nvalidGameMessage');
test('forged player IDs, countdowns, question attributes and scores are rejected', () => {
  const q = {n:0,total:3,t:'art',p:'Haus',dur:10,o:['der','die','das']};
  assert.ok(valid('q',q));
  assert.ok(valid('join',{pid:'abc123',name:'Edwin',av:'🦊'}));
  const html = '"><img src=x onerror=bad()>';
  assert.ok(!valid('join',{pid:html,name:'guest',av:'🦊'}));
  assert.ok(!valid('ready',{...q,n:html}));
  assert.ok(!valid('q',{...q,o:[html]}));
  assert.ok(!valid('q',{...q,t:'slider',min:html,max:2}));
  const res = {abc123:{rank:1,of:2,score:10,ok:1,team:0}};
  assert.ok(valid('end',{res}));
  res.abc123.rank = html;
  assert.ok(!valid('end',{res}));
});

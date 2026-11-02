const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source=fs.readFileSync('konto.js','utf8');
const window={GRAM:{requiredExercises:()=>['u1','u2']}};
const done=vm.runInNewContext(source.slice(source.indexOf('function doneTask'),source.indexOf('function kpis'))+'\ndoneTask',{window});
test('legacy chapters, frozen requirements and individual exercises use the assignment pass mark',()=>{
  const scores={'me|1|u1':1,'me|1|u2':0.69,'other|1|u2':1};
  assert.equal(done(scores,'me',{items:[{ch:1,ex:null}]},70),0);
  assert.equal(done(scores,'me',{items:[{ch:1,ex:'u1'}]},70),1);
  assert.equal(done(scores,'me',{items:[{ch:1,required:['u1']}]},70),1);
  assert.equal(done(scores,'me',{items:[{ch:1,required:[]}]},70),0);
  scores['me|1|u2']=0.7;
  assert.equal(done(scores,'me',{items:[{ch:1,ex:null}]},70),1);
});

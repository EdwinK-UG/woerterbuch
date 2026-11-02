const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source=fs.readFileSync('config.js','utf8');
async function config(override){
  const context={location:{hostname:'localhost',protocol:'http:'},URL,
    fetch:async()=>({ok:!!override,json:async()=>override})};
  context.window=context;
  vm.runInNewContext(source,context);await context.CONFIG_READY;
  return context;
}
test('local writes require separate staging services',async()=>{
  const preview=await config(null);assert.equal(preview.APP_CONFIG.readOnly,true);
  assert.throws(()=>preview.assertWritable(),/read-only/);
  const production=await config({environment:'staging',...preview.APP_CONFIG});
  assert.equal(production.APP_CONFIG.readOnly,true);
  const staging=await config({environment:'staging',supabaseUrl:'https://staging.example.invalid',
    workerUrl:'https://worker.example.invalid',supabaseKey:'sb_publishable_fixture'});
  assert.equal(staging.APP_CONFIG.readOnly,false);staging.assertWritable();
});

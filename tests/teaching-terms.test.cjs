const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
test('term drafts are flexible; publishing requires a timetable and ordered dates',()=>{
  const fields={},source=fs.readFileSync('konto.js','utf8');
  const read=vm.runInNewContext(source.slice(source.indexOf('function readTerm('),source.indexOf('function liveClassSheet('))+'\nreadTerm',{T:x=>x,$:id=>fields[id]});
  assert.equal(read('kc').live_open,false);
  fields.kc_open={checked:true};
  assert.throws(()=>read('kc'),/term name/);
  for(const [key,value] of Object.entries({term:'Spring intake',start:'2027-02-01',end:'2027-02-28',schedule:'Mon 18:00 EAT',notify:'teacher@example.invalid',details:'Weekly feedback'}))fields['kc_'+key]={value};
  assert.equal(read('kc').course_details,'Weekly feedback');
  fields.kc_end.value='2027-01-31';
  assert.throws(()=>read('kc'),/end date/);
});

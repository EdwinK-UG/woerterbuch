/* Build independent review lesson copies. NEVER writes to .local/lessons,
 * which can be a symlink into another checkout. Output must not be public. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Film=require('../grammatik/film.js');
function build(source,scripts,output){
  const src=fs.realpathSync(source),dst=path.resolve(output);
  if(fs.existsSync(dst)&&fs.lstatSync(dst).isSymbolicLink())throw Error('Output cannot be a symlink.');
  fs.mkdirSync(dst,{recursive:true});
  const real=fs.realpathSync(dst);
  if(real===src||real.startsWith(src+path.sep)||src.startsWith(real+path.sep))throw Error('Source and output must be separate directories.');
  const films=require(path.resolve(scripts)),index=[];
  for(const [n,film] of Object.entries(films)){
    Film.validate(film);let lesson;
    const original=fs.readFileSync(path.join(src,'k'+n+'.js'),'utf8');
    vm.runInNewContext(original,{GRAM:{add:x=>{lesson=x;}}},{timeout:3000});
    if(!lesson||lesson.n!==+n||lesson.level!==film.level||film.n!==+n)throw Error('Storyboard/lesson identity mismatch: '+n);
    const outputFile=path.join(real,'k'+n+'.js');
    if(fs.existsSync(outputFile)&&fs.lstatSync(outputFile).isSymbolicLink())throw Error('Refusing a symlink output: '+outputFile);
    // Wrap the original source instead of JSON-serialising it: authored generators,
    // functions and every existing exercise remain intact.
    fs.writeFileSync(outputFile,'// Private review copy; original source preserved inside the wrapper.\n(function(GRAM){\n'+original+'\n})(Object.assign(Object.create(GRAM),{add: lesson => GRAM.add({...lesson,film:'+JSON.stringify(film)+'})}));\n');
    const t=Film.compile(film);index.push({n:+n,level:film.level,title:film.title,scenes:film.scenes.length,minutes:Math.round(t.duration/6)/10,coverage:film.coverage});
  }
  const indexFile=path.join(real,'index.json');if(fs.existsSync(indexFile)&&fs.lstatSync(indexFile).isSymbolicLink())throw Error('Refusing a symlink index.');
  fs.writeFileSync(indexFile,JSON.stringify(index,null,2)+'\n');return index;
}
if(require.main===module){
 const root=path.resolve(__dirname,'..');
 const rows=build(process.argv[2]||path.join(root,'.local/lessons'),process.argv[3]||path.join(root,'.local/animation-scripts/stories.cjs'),process.argv[4]||path.join(root,'.local/animation-lessons'));
 console.log('Built '+rows.length+' independent private film lessons; '+rows.reduce((n,r)=>n+r.scenes,0)+' authored scenes.');
}
module.exports={build};

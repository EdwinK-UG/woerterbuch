/* An offline, private review deliverable. Contains authored storyboards only,
 * never accounts, lesson exercises, API keys or remote resources. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const Film=require('../grammatik/film.js');
const root=path.resolve(__dirname,'..'),scripts=process.argv[2],output=process.argv[3];
if(!scripts||!output)throw Error('Usage: node tools/package-film-preview.cjs PRIVATE_STORIES.cjs ABSOLUTE_OUTPUT.html');
const out=path.resolve(output);if(out===root||out.startsWith(root+path.sep))throw Error('Keep the private review artifact outside the public checkout.');
if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('Refusing to overwrite a symlink.');
const films=require(path.resolve(scripts));Object.values(films).forEach(Film.validate);
let html=fs.readFileSync(path.join(root,'prototypes/film/preview.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="../../grammatik/film.css">','<style>'+fs.readFileSync(path.join(root,'grammatik/film.css'),'utf8')+'</style>');
html=html.replace('<script src="../../grammatik/film.js"></script>','<script>'+fs.readFileSync(path.join(root,'grammatik/film.js'),'utf8')+'</script>');
const boot=html.lastIndexOf('<script>');html=html.slice(0,boot)+`<script>
'use strict';
const films=${JSON.stringify(films).replace(/</g,'\\u003c')};
const select=document.getElementById('lesson'),status=document.getElementById('status'),host=document.getElementById('player');let current,player;
function show(n){player?.dispose();current=films[n];player=GRAM_FILM.mount(host,current,{production:true});status.textContent=current.level+' · '+current.scenes.length+' Szenen · '+Math.ceil(player.timeline.duration/60)+' Minuten · lokale Arbeitsfassung';}
Object.values(films).forEach(f=>{const o=document.createElement('option');o.value=f.n;o.textContent=f.level+' · '+f.title;select.append(o);});
select.value=109;select.onchange=()=>show(select.value);document.getElementById('fullscreen').onclick=()=>GRAM_FILM.open(current,{production:true});show(select.value);
</script></body></html>`;
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log('Packaged '+Object.keys(films).length+' private films into one offline HTML file.');

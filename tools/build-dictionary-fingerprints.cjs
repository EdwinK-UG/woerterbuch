// Fingerprints allow the translation service to accept only the published
// dictionary text, rather than becoming an arbitrary public AI prompt endpoint.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
require('../js/dictionary-english.js');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,name))));
const core = read('core.bin'), definitions = read('defs.bin');
if (core.e.length !== definitions.length) throw Error('Dictionary files do not match');
const hashes = core.e.map((entry,i) => crypto.createHash('sha256').update(JSON.stringify([entry[0], definitions[i][0]])).digest('hex'));
const output = JSON.stringify(hashes)+'\n', file = path.join(root,'worker/src/dictionary-fingerprints.json');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file,'utf8') !== output) throw Error('Dictionary fingerprints are stale');
} else fs.writeFileSync(file,output);
const curated = require('../content/dictionary-english-reviewed.json'), seed = {};
for (const [word, values] of Object.entries(curated)) {
  const i = core.e.findIndex(row=>row[0]===word);
  if (i < 0) throw Error('Unknown curated word '+word);
  const source = DictionaryEnglish.source(word,definitions[i][0]);
  if (Object.keys(values).length !== source.length || source.some(item=>!values[item.key])) throw Error('Incomplete curated translation '+word);
  seed[hashes[i]] = source.map(({key})=>({key,en:values[key]}));
}
const seedFile = path.join(root,'content/dictionary-english.json'), seedOutput = JSON.stringify(seed,null,2)+'\n';
if (process.argv.includes('--check')) {if (fs.readFileSync(seedFile,'utf8') !== seedOutput) throw Error('Curated English data are stale');}
else fs.writeFileSync(seedFile,seedOutput);
console.log('Verified '+hashes.length+' dictionary source fingerprints.');

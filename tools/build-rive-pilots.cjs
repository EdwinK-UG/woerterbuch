// Build private pilot payloads; no authored text, answers or audio enter the public tree.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const root = path.resolve(__dirname, '..');
const source = process.env.RIVE_PILOT_SOURCE_DIR || path.join(root, '.local/rive-pilots/source');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function build() {
  const authored = fs.readFileSync(path.join(source, 'lessons.js'));
  const { cast, lessons, recordingPlan } = await import('data:text/javascript;base64,' + authored.toString('base64'));
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'recordings/manifest.json')));
  const voices = { Elisa: 'Ew9k3hOjG0x2iTWems98', Kathi: '3BJlzlfZWFVNGCc1ha9m', Sepp: '2baru8J0e15nxuG3bzXy', Liv: 'de-DE-GiselaNeural' };
  const payloads = {};
  for (const [key, chapter] of [['a1', 1], ['b1', 54]]) {
    const lesson = lessons[key];
    if (lesson.chapter !== chapter) throw Error('Unexpected chapter mapping');
    const cues = recordingPlan.filter(cue => cue.lesson === key);
    const recordings = cues.map(cue => {
      const entry = manifest[cue.id];
      if (!entry || entry.filename !== cue.id + '.mp3') throw Error('Missing recording: ' + cue.id);
      const audio = fs.readFileSync(path.join(source, 'recordings', entry.filename));
      if (entry.text_sha256 !== digest(cue.text) || entry.audio_sha256 !== digest(audio) ||
          !Number.isFinite(entry.duration_seconds) || entry.duration_seconds <= 0) throw Error('Stale recording: ' + cue.id);
      if (voices[cue.speaker] && entry.spec.voice !== voices[cue.speaker]) throw Error('Wrong voice: ' + cue.id);
      if (cue.speaker === 'Liv' && (entry.spec.provider !== 'azure' || entry.spec.region !== 'eastus')) throw Error('Liv must use Azure East US');
      return [cue.id, { duration: entry.duration_seconds, url: 'data:audio/mpeg;base64,' + audio.toString('base64') }];
    });
    payloads[chapter] = { level: lesson.level, source: JSON.stringify({ cast, lessons: { [key]: lesson }, recordingPlan: cues, recordings }) };
    console.log('Chapter ' + chapter + ': ' + recordings.length + ' verified recordings');
  }
  const out = path.join(root, '.local/rive-pilots/pilots.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ gzip: gzipSync(JSON.stringify(payloads)).toString('base64') }), { mode: 0o600 });
  console.log('Built private pilot payloads at ' + path.relative(root, out));
}
build().catch(error => { console.error(error.message); process.exitCode = 1; });

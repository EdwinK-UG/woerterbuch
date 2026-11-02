/* Validate public Realtime broadcasts before a game handler uses their fields. */
function validGameMessage(event, p) {
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const number = (x, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(x) && x >= min && x <= max;
  const string = (x, max = 8192) => typeof x === 'string' && x.length <= max;
  const pid = x => typeof x === 'string' && /^[a-z0-9]{1,32}$/.test(x) && !Object.hasOwn(Object.prototype, x);
  const type = x => ['mc','gap','tf','art','type','order','img','poll','slider'].includes(x);
  const team = x => number(x,0,4);
  const round = x => number(x.n) && number(x.total,1) && x.n < x.total && type(x.t);
  const placement = x => object(x) && number(x.rank,1,80) && number(x.of,x.rank,80) && number(x.score);
  const results = check => object(p.res) && Object.keys(p.res).length <= 80 &&
    Object.entries(p.res).every(([id,r]) => pid(id) && placement(r) && check(r));
  if (!object(p)) return false;
  switch (event) {
    case 'join': return pid(p.pid) && string(p.name,128) && string(p.av,32);
    case 'leave': case 'kick': return pid(p.pid);
    case 'welcome': return pid(p.pid) && string(p.name,128) && team(p.team) && string(p.title);
    case 'ready': return round(p);
    case 'q':
      if (!round(p) || !string(p.p) || !number(p.dur,1,600) ||
          (p.img && !(string(p.img,2048) && /^https:\/\//i.test(p.img))) ||
          (p.sub && !string(p.sub)) || (p.unit && !string(p.unit))) return false;
      if (p.t === 'slider') return Number.isFinite(p.min) && Number.isFinite(p.max) &&
        p.min < p.max && (p.step == null || (Number.isFinite(p.step) && p.step > 0));
      if (p.t === 'type') return true;
      return Array.isArray(p.o) && p.o.length > 0 && p.o.length <= 256 &&
        p.o.every(o => string(o) && (p.t !== 'art' || ['der','die','das'].includes(o)));
    case 'ans': return pid(p.pid) && number(p.n) && (string(p.v) || Number.isFinite(p.v) ||
      (Array.isArray(p.v) && p.v.length <= 256 && p.v.every(i => number(i,0,255))));
    case 'reveal': return (!p.right || string(p.right)) && results(r =>
      [true,false,null].includes(r.ok) && number(r.pts) && number(r.streak) &&
      (!r.ahead || (string(r.ahead.name,128) && number(r.ahead.gap))));
    case 'end': return (!p.teams || (Array.isArray(p.teams) && p.teams.length <= 4 &&
      p.teams.every(t => object(t) && team(t.k)))) && results(r => team(r.team) && number(r.ok));
    case 'count': return number(p.a,0,80) && number(p.of,p.a,80);
    case 'scores': case 'hb': case 'bye': case 'lobby': return true;
    default: return false;
  }
}

/* Original, code-native C1 illustrations. No remote image requests or tracking. */
(function (root) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const p = (d, a='') => `<path d="${d}" ${a}/>`;
  const r = (x,y,w,h,fill='var(--va-paper)',rx=8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const c = (x,y,rad,fill='var(--va-ac)') => `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}"/>`;
  const t = (x,y,text,size=12) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="var(--va-ink)" stroke="none" font-family="Inter,system-ui,sans-serif">${esc(text)}</text>`;
  const line = (x,y,a,b,extra='') => p(`M${x} ${y}L${a} ${b}`,`fill="none" ${extra}`);
  const arr = (x,y,a,b) => {const len=Math.hypot(a-x,b-y)||1,ux=(a-x)/len,uy=(b-y)/len;return line(x,y,a,b)+p(`M${a-7*ux-5*uy} ${b-7*uy+5*ux}L${a} ${b}L${a-7*ux+5*uy} ${b-7*uy-5*ux}`,'fill="none"');};
  function person(x,y,o={}) {
    const s=o.scale||1, skin=['#b77650','#e9ad7f','#784d3f','#ce946d'][o.skin||0];
    return `<g transform="translate(${x} ${y}) scale(${s})">${c(0,-36,12,skin)}${p('M-12 -40Q-10 -57 4 -50L12 -39L3 -43L-4 -36Z','fill="var(--va-ink)" stroke="none"')}${p('M-18 5V-13Q-18 -25 0 -25Q18 -25 18 -13V5Z','fill="var(--va-ac)" stroke="none"')}${o.sad?p('M-4 -31Q0 -35 4 -31','fill="none" stroke-width="1.7"'):p('M-4 -32Q0 -28 4 -32','fill="none" stroke-width="1.7"')}${line(-8,5,o.walk?-19:-8,29)}${line(8,5,o.walk?22:8,29)}${line(-16,-17,-28,o.arm?-37:-2)}${line(16,-17,28,o.arm?-37:-2)}</g>`;
  }
  const gear = (x,y) => `<g transform="translate(${x} ${y})">${c(0,0,24,'var(--va-tint)')}${c(0,0,9,'var(--va-paper)')}${[0,45,90,135].map(a=>`<g transform="rotate(${a})">${line(-31,0,-20,0)}${line(20,0,31,0)}</g>`).join('')}</g>`;
  const coin = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${c(0,0,15,'var(--va-gold)')}${t(0,5,'€',15)}</g>`;
  const book = (x,y) => `<g transform="translate(${x} ${y})">${p('M0 10Q22 -2 45 8V65Q22 55 0 67Q-22 55 -45 65V8Q-22 -2 0 10Z','fill="var(--va-paper)"')}${line(0,10,0,67)}${[-1,1].map(s=>[25,36,47].map(y=>line(s*9,y,s*34,y-3)).join('')).join('')}</g>`;
  const bubble = (x,y,fill='var(--va-paper)') => `<g transform="translate(${x} ${y})">${p('M0 0H66Q75 0 75 10V33Q75 43 65 43H28L15 55V43H0Q-8 43 -8 33V10Q-8 0 0 0Z',`fill="${fill}"`)}${[12,31,50].map(a=>c(a,21,3,'var(--va-ac)')).join('')}</g>`;
  const objects={Buchrücken:'book-spine',Flaschenhals:'bottle',Lampenfuß:'lamp',Hängesessel:'hanging-chair',Kopflehne:'headrest',Stuhlbein:'chair-leg',Tischbein:'table-leg',Tischdecke:'tablecloth',Bademantel:'robe',Bettlaken:'sheet',Filzpantoffel:'slipper',Hosenträger:'braces',Klettverschluss:'velcro',Knopfleiste:'buttons',Reißverschluss:'zip',Rollkragenpulli:'turtleneck',Schnürband:'lace',Schnürstiefel:'boot',Seidentuch:'scarf',Strickjacke:'cardigan',Kettensäge:'chainsaw',Nagelkopf:'nail',Steckerleiste:'power-strip',Wasserwaage:'level',Schneeschaufel:'shovel',Bohrmaschine:'drill',Bratpfanne:'pan',Küchenmaschine:'processor',Schaumkelle:'skimmer',Schneebesen:'whisk',Stabmixer:'stick-blender',Gemüseschäler:'peeler',Fahrradlenker:'handlebar',Farbverdünner:'thinner',Rasenmäher:'mower',Reiskocher:'rice-cooker',Melkmaschine:'milker',Mähdrescher:'harvester',Feldspritze:'sprayer',Pflanzenschutzgerät:'sprayer',Güllepumpe:'pump',Pflanzmaschine:'planter',Viehtransporter:'livestock-truck','rote Bete':'beet',Chicorée:'chicory',Dill:'dill',Fenchel:'fennel',Gerste:'grain',Hafer:'grain',Kardamom:'cardamom',Kürbis:'pumpkin',Krapfen:'doughnut',Kreuzkümmel:'cumin',Nelke:'clove',Roggen:'grain',Rosenkohl:'sprouts',Spekulatius:'biscuit',Tortenguss:'glaze',Vanillekipferl:'crescent',Weizen:'grain',Zimtstern:'star-cookie',Baumring:'tree-ring',Durchmesser:'diameter',Radius:'radius',Umfang:'circumference',Kreiszahl:'pi',Primzahl:'prime',Quadratzahl:'square',Potenz:'power',Dutzend:'dozen'};
  function objectScene(k) {
    if(k==='book-spine')return p('M101 47L171 35L209 60V154L140 167L101 143Z','fill="var(--va-paper)"')+p('M101 47L140 71V167L101 143Z','fill="var(--va-ac)"')+line(141,71,208,59)+line(113,68,128,77)+line(113,124,128,133);
    if(k==='bottle')return p('M133 30H168V73Q197 93 197 118V165H105V118Q105 93 133 73Z','fill="var(--va-paper)"')+r(133,31,35,44,'var(--va-ac)',3)+r(111,118,79,32,'var(--va-tint)',3)+line(138,26,164,26);
    if(k==='lamp')return p('M114 36H188L216 102H84Z','fill="var(--va-paper)"')+line(151,102,151,153)+p('M151 149Q197 149 204 168H98Q104 149 151 149Z','fill="var(--va-ac)"');
    if(k==='hanging-chair')return line(151,10,151,38)+p('M150 38Q238 80 211 142Q192 179 117 165Q48 131 103 70Z','fill="var(--va-tint)"')+p('M107 118Q151 82 201 124V145H108Z','fill="var(--va-paper)"')+r(117,136,80,21,'var(--va-ac)',12);
    if(k==='headrest'||k==='chair-leg')return r(111,42,81,25,k==='headrest'?'var(--va-coral)':'var(--va-paper)',9)+r(108,74,88,47,'var(--va-tint)',10)+r(99,116,105,20,'var(--va-paper)',8)+line(111,136,104,171,k==='chair-leg'?'stroke="var(--va-coral)" stroke-width="8"':'')+line(193,136,200,171);
    if(k==='table-leg'||k==='tablecloth')return p('M67 79L151 45L237 79L151 117Z',`fill="${k==='tablecloth'?'var(--va-ac)':'var(--va-paper)'}"`)+line(72,82,72,151,k==='table-leg'?'stroke="var(--va-coral)" stroke-width="8"':'')+line(151,117,151,172)+line(232,81,232,152)+(k==='tablecloth'?p('M67 79V103L151 138L237 104V79L151 117Z','fill="var(--va-tint)"'):'');
    if(k==='robe')return p('M116 33L85 54L65 113L92 123L111 84V168H193V84L210 123L239 112L218 54L186 33L152 87Z','fill="var(--va-tint)"')+p('M116 33L154 97L187 33M153 96V166','fill="none"')+r(112,110,79,12,'var(--va-ac)',0)+p('M151 121L138 150M154 121L171 143','fill="none"');
    if(k==='sheet')return p('M73 50H222L247 157H46Z','fill="var(--va-paper)"')+r(89,60,116,31,'var(--va-tint)',10)+p('M62 110Q140 120 236 109L247 157H46Z','fill="var(--va-ac)"')+line(62,159,62,178)+line(232,159,232,178);
    if(k==='slipper'||k==='boot')return p(k==='boot'?'M101 36H168V106L214 132Q228 143 220 158H87V120L99 91Z':'M70 135Q86 100 133 102L158 128L214 139Q233 149 215 162H77Q58 157 70 135Z','fill="var(--va-tint)"')+line(94,160,217,160)+(k==='boot'?[55,70,85,100].map(y=>line(131,y,162,y+8)+line(132,y+9,162,y-1)).join(''):p('M127 108Q128 145 159 130','fill="var(--va-paper)"'));
    if(k==='braces')return p('M91 40H113L131 103H169L187 40H209L184 130V170H116V130Z','fill="var(--va-tint)"')+line(102,44,129,130)+line(198,44,171,130)+r(120,120,18,16,'var(--va-ac)',2)+r(162,120,18,16,'var(--va-ac)',2);
    if(k==='zip'||k==='buttons'||k==='velcro')return r(94,32,112,139,'var(--va-tint)',12)+line(150,34,150,169)+(k==='zip'?[50,67,84,101,118,135,152].map(y=>r(144,y,12,9,'var(--va-ac)',1)).join('')+r(141,48,18,27,'var(--va-paper)',3):k==='buttons'?[59,96,133].map(y=>c(143,y,8,'var(--va-paper)')+line(163,y,181,y)).join(''):r(114,52,71,48,'var(--va-paper)',4)+Array.from({length:20},(_,i)=>p(`M${121+i%5*12} ${59+Math.floor(i/5)*11}q5 -6 5 0`,'fill="none" stroke="var(--va-ac)"')) .join(''));
    if(k==='turtleneck'||k==='cardigan')return p('M119 46H181L213 62L235 107L209 123L191 89V168H109V89L91 123L65 107L87 62Z','fill="var(--va-tint)"')+(k==='turtleneck'?r(129,24,42,38,'var(--va-ac)',5):line(151,51,151,166)+[74,96,118,140].map(y=>c(159,y,3,'var(--va-ac)')).join(''));
    if(k==='scarf')return p('M80 46L150 24L224 47L173 100L200 170L158 154L130 92L112 139L83 160L110 91Z','fill="var(--va-peach)"')+p('M80 46L130 91L174 100M151 27L132 89','fill="none"');
    if(k==='lace')return p('M68 73Q69 30 109 65L150 107L191 65Q232 30 232 73Q219 104 151 106Q113 145 92 168M151 108Q190 145 210 168','fill="none" stroke="var(--va-ac)" stroke-width="6"')+c(151,107,8,'var(--va-paper)');
    if(k==='nail')return p('M138 48H164L158 157L151 177L144 157Z','fill="var(--va-tint)"')+p('M118 36H184V50H118Z','fill="var(--va-ac)"')+arr(64,44,111,44);
    if(k==='level')return r(52,75,197,57,'var(--va-gold)',6)+r(99,89,107,28,'var(--va-paper)',10)+line(139,90,139,117)+line(167,90,167,117)+c(153,103,8,'var(--va-mint)')+line(38,146,264,146);
    if(k==='chainsaw')return r(56,83,88,66,'var(--va-ac)',15)+p('M80 80V57H129V83','fill="none" stroke-width="8"')+p('M140 93H239Q259 104 239 118H140Z','fill="var(--va-paper)" stroke-dasharray="4 4"')+line(153,105,235,105)+c(102,117,10,'var(--va-paper)');
    if(k==='handlebar')return p('M147 165V92H79Q56 92 63 62L76 45M151 92H224Q245 92 237 62L225 45','fill="none" stroke-width="8"')+p('M75 44L66 63M224 45L234 64','stroke="var(--va-ac)" stroke-width="15"');
    if(k==='peeler')return p('M133 91L115 160Q120 179 139 167L162 98','fill="var(--va-ac)"')+p('M109 40H190V79L157 101L131 90L109 70Z','fill="var(--va-tint)"')+line(119,55,182,55)+line(125,67,177,67);
    if(k==='skimmer')return line(149,30,149,100)+c(149,127,38,'var(--va-paper)')+[-15,0,15].map(x=>[-15,0,15].map(y=>c(149+x,127+y,3,'var(--va-ac)')).join('')).join('');
    if(k==='stick-blender')return r(129,27,43,71,'var(--va-ac)',19)+line(149,98,149,147)+p('M149 140Q121 141 117 163H182Q178 142 149 140Z','fill="var(--va-paper)"')+c(149,49,5,'var(--va-paper)');
    if(k==='rice-cooker')return r(79,71,145,91,'var(--va-paper)',20)+p('M78 79Q78 38 151 38Q224 38 224 79Z','fill="var(--va-tint)"')+r(130,28,43,13,'var(--va-ac)',4)+r(122,105,58,30,'var(--va-tint)',8)+c(151,120,6,'var(--va-ac)');
    if(k==='thinner')return p('M107 52H130V30H176V52H197V165H107Z','fill="var(--va-paper)"')+r(120,87,65,42,'var(--va-tint)',3)+p('M152 96L141 114H162Z','fill="var(--va-coral)"')+line(134,26,172,26);
    if(k==='mower')return p('M76 127H215L201 105H112Z','fill="var(--va-ac)"')+c(95,143,18,'var(--va-ink)')+c(203,143,18,'var(--va-ink)')+p('M111 106L82 50H54','fill="none" stroke-width="5"')+r(137,82,54,30,'var(--va-paper)',8);
    if(k==='milker')return r(112,78,84,82,'var(--va-paper)',16)+r(109,68,90,15,'var(--va-ac)',5)+p('M112 99Q68 81 68 119V145','fill="none"')+r(56,143,23,33,'var(--va-tint)',6)+line(154,68,154,39);
    if(['sprayer','harvester','planter','pump','livestock-truck'].includes(k))return r(94,82,107,61,'var(--va-tint)',9)+r(153,51,44,37,'var(--va-paper)',3)+c(106,144,21,'var(--va-ink)')+c(202,144,18,'var(--va-ink)')+(k==='sprayer'?line(46,96,248,96)+[53,78,102,226,249].map(x=>p(`M${x} 101l-5 15m5 -15 5 15`,'fill="none" stroke="var(--va-ac)"')).join(''):k==='planter'?[63,82,103].map(x=>line(x,118,x,142)+c(x,160,3,'var(--va-gold)')).join(''):k==='pump'?p('M94 99Q40 73 41 143M200 105Q253 80 256 145','fill="none" stroke-width="8"'):k==='harvester'?r(55,125,66,26,'var(--va-ac)',3)+[60,75,90,105].map(x=>line(x,147,x,164)).join(''):r(79,59,123,70,'var(--va-paper)',4)+[100,125,151,177].map(x=>line(x,68,x,120)).join(''));
    if(k==='tree-ring')return c(151,102,69,'var(--va-peach)')+[55,41,27,13].map(rad=>c(151,102,rad,'none')).join('')+p('M150 33L161 72L146 109L166 169','fill="none" stroke="var(--va-coral)"');
    if(['diameter','radius','circumference','pi','prime','power','dozen','square'].includes(k)){
      if(k==='prime')return t(150,100,'2 · 3 · 5 · 7',27)+t(150,139,'11 · 13 · 17',18);
      if(k==='power')return t(135,120,'2',65)+t(177,74,'3',33)+t(150,165,'2 × 2 × 2 = 8',18);
      if(k==='dozen')return Array.from({length:12},(_,i)=>c(87+i%4*42,52+Math.floor(i/4)*44,12,'var(--va-tint)')).join('');
      if(k==='square')return r(87,38,126,126,'var(--va-tint)',0)+[1,2].map(i=>line(87+i*42,38,87+i*42,164)+line(87,38+i*42,213,38+i*42)).join('')+t(150,193,'3 × 3 = 9',14);
      return c(150,101,63,'var(--va-tint)')+c(150,101,3,'var(--va-ink)')+(k==='circumference'?c(150,101,64,'none'):line(k==='diameter'?87:150,101,213,101))+(k==='pi'?t(150,109,'π',38):t(k==='diameter'?146:179,91,k==='diameter'?'d':k==='radius'?'r':'',18));
    }
    if(['beet','chicory','dill','fennel','grain','cardamom','pumpkin','doughnut','cumin','clove','sprouts','biscuit','glaze','crescent','star-cookie'].includes(k)){
      if(k==='dill'||k==='grain')return [111,151,191].map((x,i)=>line(x,165,x,51+i*10)+[74,94,114].map(y=>p(k==='grain'?`M${x} ${y}q-20 -22 -14 -27q17 3 14 27q20 -22 14 -27q-17 3 -14 27`:`M${x} ${y}l-30 -15m30 15 30 -15`,'fill="var(--va-mint)"')).join('')).join('');
      if(k==='cumin'||k==='cardamom'||k==='clove')return r(67,128,173,30,'var(--va-paper)',15)+Array.from({length:k==='clove'?5:9},(_,i)=>`<g transform="translate(${88+i%5*30} ${78+Math.floor(i/5)*31}) rotate(${i*31})">${k==='clove'?c(0,0,7,'var(--va-peach)')+line(0,6,0,23):p(k==='cardamom'?'M0 -13Q19 -2 0 15Q-17 0 0 -13Z':'M0 -12Q9 0 0 12Q-6 0 0 -12Z','fill="var(--va-mint)"')+line(0,-7,0,8)}</g>`).join('');
      if(k==='sprouts')return [90,129,172,210].map((x,i)=>c(x,118-i%2*27,22,'var(--va-mint)')+p(`M${x-10} ${114-i%2*27}q20 -12 17 12q-20 12 -17 -12`,'fill="none"')).join('');
      if(k==='crescent')return p('M81 61Q94 166 212 146Q151 195 98 159Q44 126 81 61Z','fill="var(--va-peach)"');
      if(k==='star-cookie')return p('M150 34L169 79L218 83L180 115L193 161L150 136L109 161L120 114L82 83L131 79Z','fill="var(--va-peach)"')+p('M150 51L165 91L204 93L172 118L182 150L150 129L121 147L128 114L99 93L140 91Z','fill="var(--va-paper)" stroke="none"');
      if(k==='doughnut')return c(151,105,56,'var(--va-peach)')+p('M102 102Q150 78 201 101','fill="none" stroke="var(--va-paper)" stroke-width="8"')+c(152,103,11,'var(--va-coral)');
      if(k==='biscuit')return r(101,40,100,131,'var(--va-peach)',12)+p('M122 70Q151 42 179 70L169 123L181 151H120L133 123Z','fill="none"');
      if(k==='glaze')return p('M78 91H224V151H78Z','fill="var(--va-peach)"')+p('M78 91Q151 41 224 91L211 104L202 102L195 119L180 104L162 114L147 104L128 115L110 100L96 108Z','fill="var(--va-coral)"');
      if(k==='fennel'||k==='chicory')return p('M150 57Q106 71 106 122Q103 162 150 167Q197 163 195 122Q193 72 150 57Z','fill="var(--va-paper)"')+p('M150 164Q118 108 150 58Q182 105 150 164M152 57L130 27M155 59L172 22M155 59L195 42','fill="none" stroke="var(--va-mint)"');
      return c(151,119,k==='pumpkin'?56:39,k==='beet'?'var(--va-coral)':'var(--va-gold)')+p('M150 78L146 40Q178 22 188 46L151 64Q120 21 109 48L146 72','fill="var(--va-mint)"')+(k==='pumpkin'?p('M150 64Q116 116 150 174Q185 118 150 64','fill="none"'):p('M145 156l7 22 9 -14','fill="none"'));
    }
    return null;
  }
  function chart(kind) {
    const ys=kind==='down'?[67,82,98,113]:kind==='flat'?[91,91,91,91]:kind==='volatile'?[75,108,63,95]:[114,99,80,57];
    return line(46,35,46,135)+line(46,135,247,135)+ys.map((y,i)=>r(65+i*43,y,25,135-y,i===3?'var(--va-ac)':'var(--va-tint)',4)).join('')+p('M72 '+ys[0]+'L115 '+ys[1]+'L158 '+ys[2]+'L201 '+ys[3],'fill="none"');
  }
  function body(where,organ) {
    const spots={head:[150,38],brain:[150,27],eye:[159,36],ear:[173,39],nose:[151,42],mouth:[150,51],neck:[150,63],shoulder:[174,73],chest:[150,85],arm:[191,96],elbow:[193,110],hand:[204,132],hip:[172,120],belly:[150,111],back:[151,96],leg:[166,151],knee:[164,153],foot:[170,174],skin:[126,92]};
    const [x,y]=spots[where]||spots.chest;
    return p('M137 61Q115 64 112 91L106 131Q107 142 117 135L127 102L125 127L135 179H148L151 136L157 179H170L178 127L176 101L187 135Q198 142 198 131L190 90Q188 65 167 61Z','fill="var(--va-tint)"')+c(152,36,22,'var(--va-paper)')+c(x,y,10,'var(--va-coral)')+c(x,y,3,'var(--va-paper)')+line(x+10,y,236,y)+t(243,y-7,organ||'',10);
  }
  const rules=[
    ['body',/achilles|\bshin(?:bone)?\b|\bcalf\b|\bheel\b|bizeps|muscle|muscul|collarbone|throat|thyroid|spine|spinal|vertebr|tailbone|jaw|\bnose\b|nasal|pore|\bribs?\b|spleen|\bcells?\b|tissue|\bhips?\b|cheekbone|esophagus|oesophagus|temple|skull|\bbrain\b|\bears?\b|navel|gland|\bnerv|mucous|\barter|blood vessel|\bjoint\b|skeleton|gelenk/i],
    ['illness',/disease|diabet|cancer|metastas|paralys|tumou?r|obes|stroke|heart attack|hypertension|blood clot|gout|tooth decay|infection|malignant|benign|nutrition|malnour|coma|sweat|anorex|bulimi/i],
    ['medicine',/medicin|medical|doctor|patient|treat|prescri|dosage|dose|anaesthe|anesthe|intraven|inject|diagnos|healing|heal|cure|surger|dermat|gynaec|gynec|urolog|psychiatr|radiolog|orthop|prevention|contraindicat|active ingredient/i],
    ['math',/diameter|radius|circumference|circle|angle|square number|prime number|equation|numerator|denominator|volume|divisib|dozen|even number|odd number|pi |^pi$|multiplication|square root|cubed/i],
    ['walk',/hobble|limp|stroll|march|sneak|creep|stride|walk|stumble|trip over|slip off/i],
    ['eat',/\beat\b|devour|gobble|gulp|swallow|wolf down|feed|appetite|satiate|taste|dine/i],
    ['sleep',/sleep|night owl|early riser|bed sheet|bathrobe|slipper/i],
    ['joy',/laugh|laughter|grin|chuckle|giggle|glee|cheer|happy|joy|elat|delighted|seventh heaven/i],
    ['sad',/sad|gloom|grief|sorrow|misery|deject|disappoint|melanch|woeful|forlorn|downcast|droop|distress/i],
    ['anger',/anger|angry|furious|rage|wrath|quarrel|belliger|argumentative|provocative/i],
    ['empathy',/empath|sympath|comfort|tact|sensitive|sensitivity|compassion|perspective|support|fellow feeling|understand.*feeling/i],
    ['fear',/fear|fright|scary|terrify|intimidat|coward|anxious|anxiety/i],
    ['face',/\bface\b|\bnose\b|freckle|\bhair\w*\b|\bchin\b|\beyes?\b|gaunt|lanky|stocky|slender|\bskin\b|stature|bony|athletic|complexion|chubby|round as/i],
    ['envious',/envy|envious|jealous|resentful|grudg/i],
    ['calm',/calm|composure|equanimity|phlegmatic|sluggish|lethargic|lazy|drive|laid-back/i],
    ['furniture',/chair|armrest|backrest|headrest|\btable\b|bench|stool|hanging seat|hammock/i],
    ['clothes',/zipper|button placket|cardigan|turtleneck|lace-up|boot|silk scarf|suspender|hook-and-loop|shoelace|Velcro/i],
    ['kitchen',/\bpan\b|whisk|blender|peeler|skimmer|rice cooker|food processor|purée|puree|whip cream|beat cream|peel|kitchen|thicken|clarify/i],
    ['tool',/saw|drill|mower|shovel|\blevel\b|nail head|power strip|extension socket|paint thinner|dilute|cutting|tool|workpiece|winding|wind up/i],
    ['speech',/talk|speech|speak|conversation|whisper|murmur|mutter|chatter|stutter|shout|scream|heckl|swear|curse|scold|tell|poem|explain|declar|confess|objection|question|assert|deny|doubt|confirm|eavesdrop|gossip/i],
    ['network',/network|contact|connect|interconnect|link|integration|social media|log in|log out|online|digital|streaming|algorithm|search term|server|data stream|filter/i],
    ['crop',/field|agricultur|cultivat|arable|acre|farm|soil|plant|sow|sowing|seedling|spray|harvest|plough|plow|thresh|fertili|pesticide|weed|wheat|rye|\boats?\b|barley/i],
    ['animal',/sheep|flock|herd|\bcow\b|\bpig\b|chicken|poultry|turkey|\bbird\b|duck|goose|\bbee\b|insect|\bdog\b|pigeon|frog|bark|bleat|grunt|cluck|\bcoo(?:ing)?\b|croak|squeak|quack|chirp|buzz|swarm|livestock|cattle|animal|milking/i],
    ['food',/beetroot|chicory|dill|fennel|gelatin|cardamom|pumpkin|doughnut|cumin|clove|brussels|biscuit|speculoos|cake glaze|vanilla|cinnamon/i],
    ['ecology',/habitat|biodivers|ecolog|environment|greenhouse|emission|renatur|sustainab|land consumption|urban sprawl|pasture|meadow|pond|animal welfare/i],
    ['work',/job|work|employment|employ|profession|vocational|career|colleague|collegial|cooperat|team|staff|personnel|management|hierarch|leadership|competenc|skill|ability|customer|qualification|organisation|organization|coordination|recognition|vacancy|position/i],
    ['safety',/safety|burn|wound|injur|cut injury|\bstab(?:bing)?\b|load limit|\bfall(?:s)?\b|electric shock|overheat|corrode|squeeze|crush|sharp.edge|authori[sz]|regulation|certifi|approved|permissib|manual|improvis|validity|expire|extinguish/i],
    ['machine',/machine|device|coolant|engine|motor|gear|key|ignition|operate|operat|commission|processing|procedure|rotat|cycle|circuit|machinery|production/i],
    ['energy',/electric|energy|power station|grid|coal|hydrogen|outage|water supply|supply|infrastructure|overload|bottleneck|shortage|scarcity|demand|resource|resilien/i],
    ['transport',/transport|traffic|logistic|commut|shipping|shipyard|freight|cargo|delivery|carpool|ride.shar|depot|junction|goods|vehicle|distribution|trade|intermediar|haulage|\bport\b|unload/i],
    ['law',/\blaw(?:s|ful|less)?\b|\bunlawful\b|\blegal\b|\bright\b|justice|court|trial|crime|criminal|theft|steal|stolen|imprison|prison|convict|acquit|accus|defendant|victim|brib|embezzle|tax evasion|fraud|\bforg(?:e|ed|ery)\b|offen[cs]e|murder|manslaughter|coerci|custody|testimony|incriminat|punish|sentence|guilt|innocen|verdict|appeal|\bcontract\b|\brent\b|wage|protection|lawful/i],
    ['democracy',/democra|parliament|executive|legislature|legislative|judiciary|constitutional|constitution|vote|voter|voting|election|ballot|politic|republic|separation of powers|sovereign|secular|government|regime|state authority|party|press.*power/i],
    ['ideology',/ideolog|fascis|patriot|pacifis|populis|social.democrat|nationalis|ethnic|left.wing|right.wing|bourgeois|progressive|illiberal|incite|agitat|hate|glorif|slander|vilify/i],
    ['book',/book|literat|novel|narrati|story|storytell|language|humanities|pedagog|socioling|education|tone|writing|text|phrase|artwork|masterful/i],
    ['history',/artefact|artifact|archaeolog|prehistory|prehistor|early history|dating|tree ring|ceramic|cultural|anthropolog|ethnolog|remains|heritage|relic/i],
    ['population',/populat|demograph|birth rate|baby boom|migration|immigration|life expectancy|living cost|poverty|poor|wealth|society|societal|sociolog|social geograph|social inequality|social participation/i],
    ['logic',/logic|fallacy|hypothes|theor|empiric|dogma|evidence|scientific|proof|prove|disprove|falsif|verif|reason|deduc|infer|conclusion|argument|assumption|suppos|plausib|consisten|contradict|premise|method|investigat|research|analog|antithes|counter.claim/i],
    ['up',/increase|grow|growth|rise|rising|soar|double|expand|promote|boost|stimulat|boom|flourish|prosper|upturn|climb|higher|sprout/i],
    ['down',/decrease|decline|shrink|reduce|reduction|falling|dwindle|halve|weaken|collapse|recession|deflation|downturn/i],
    ['flat',/stagn|constant|stable|stabili|unchang|steady|maintain|preserve|sustain|uphold/i],
    ['volatile',/fluctuat|volatile|turbulen|erratic|leap|unstable|rocky|fragil/i],
    ['money',/money|financ|credit|debt|bank|account|payment|salary|pay|remuner|wage|\bfee\b|commission|currency|dividend|interest|tax|income|cost|expense|price|profit|loss|invest|security|securities|share|budget|penniless|cash|stingy|spend|waste|save|afford|fund|econom|business|insolven|bankrupt|revenue|market|subsid|bill|invoice|wealth|repay|reimburse|debit|loan|rent.free/i],
    ['time',/time|earliest|soonest|next possible|afterward|subsequent|duration|long.last|period|quarter|appointment|deadline/i],
    ['target',/aim|target|focus|goal|objective|attention|point|purpose|intention|interest|outset|emphasis/i],
    ['contrast',/contrast|opposite|oppos|differ|heterogen|homogen|equal|equival|uniform|divers|variet|unequal/i],
    ['cause',/cause|result|consequ|trigger|lead to|give rise|stem from|derive|therefore|hence|accordingly|in view|provided|unless|without|whereas|instead|depending/i],
    ['thought',/think|cogniti|intellect|mental|rational|understand|perceiv|awareness|conscious|imagin|realise|realiz|mind|clear|hazy|clouded|sharp|trained|alert|senses|grasp/i]
  ];
  // A second, sense-aware layer for words that benefit from a specific visual analogy.
  const conceptRules=[
    ['idiom',/Katze aus|Faden verlieren|rosarote Brille|siebten Himmel|Korb bekommen|Pferde durch/],
    ['drink',/drink excessively|drink too many/],['dilution',/etw. verdünnen/],['spool',/etw. aufwickeln/],['tilt',/umkippen|umstürzen|herabfallen/],
    ['eat',/force food down|stuff oneself|satisfy.*hunger/],
    ['sad',/utterly miserable|crestfallen|experience suffering|pessimistic|drab everyday/],
    ['joy',/exuberance|high spirits|joker|on cloud nine|lucky devil/],
    ['anger',/to see red|annoying person|treacherous|cunning|bloodlust/],
    ['face',/pout|wrinkle|sparse.*thin|delicate.*petite|giant, hulk|crooked/],
    ['speech',/garrulous|gabby|quick-witted|to babble|hoot, howl|to nag|complain|make a statement|to witness|reveal a secret|beg|insist|to offend|boast|give.*explanation|air.*dirty laundry/],
    ['silence',/secretive|silent|tight-lipped|introverted/],
    ['envelope',/deliver a message|get in touch|Kontakt aufnehmen/],
    ['glasses',/naive|gullible|trusting, ingenuous/],
    ['sugar',/sweet tooth/], ['cleaning',/Schmutzfink|Putzteufel/], ['home',/homebody|couch potato/], ['eyes',/ablenken|ausblenden/], ['label',/Plakette/], ['cloudy',/trübe/], ['hectare',/Hektar/], ['rays',/ausstrahlen/], ['energy',/elektrifizieren|Elektrifizierung/], ['democracy',/an die Urne gehen/], ['empathy',/wertschätzend|öffentliche Frieden/], ['thought',/Entgiftung|Suchtpotenzial|eingehend|Herangehensweise/],
    ['cloth',/tea towel/], ['swing',/swing back and forth/], ['tree',/^fell$/],
    ['farm',/fish meal|free range|liquid manure|monoculture|^hectare$/],
    ['animal',/^pack$|to milk/],
    ['digestion',/intestine|microbiome|metabolism|digestive system|digestible|indigestible/],
    ['body',/biceps|larynx|mandible|nostril|pinna, auricle|ureter/],
    ['microbe',/infectious|bacterial/], ['medicine',/medication|curable|blood sugar/],
    ['porous',/porous/], ['rays',/^radiate$/], ['coagulate',/coagulate/],
    ['access',/accessibility|Barrierefreiheit/], ['machine',/maintenance/],
    ['balance',/ausbalancieren|ausgleichen|kompensieren|offset something|counteract/],
    ['obstacle',/hindrance|obstruction|entry requirement|reach one's limits/],
    ['document',/draft.*document|survey|record, recording|gewährleisten|grant permission|to regulate|regulate|regulation/],
    ['roof',/roof tile/], ['measure',/maximum load|measured against|segment|number of units|flächendeckend/],
    ['cycle',/cyclic|interplay|Wechselspiel/],
    ['evidence',/well-founded|conclusive|unmistakable|provable|be an indication|provide insight|to refute|to figure out|to be obvious|Revise|revise an opinion|sich.*decken/],
    ['network',/decentralisation|centralization|collectivization|public services|the public sector|welfare state|common good|social|include|assign|urbaniz|municipality/],
    ['isolation',/isolation|person present|excluded from|third country/],
    ['location',/localization|relocate|shift from|Endverbrauch|end consumer|location/],
    ['flow',/flow|surplus|factor in|extract|enormous|immense|set something in motion|emerge from|start.*from|to use|be applied/],
    ['speed',/rapid|as soon as possible|quickly|swiftly/],
    ['time',/not last long|persistent|for life/],
    ['document',/aushandeln|negotiate|incentive|request|principle|maxim|discourse|grant|approval|Justify|justify/],
    ['thought',/instinct|anticip|forecast|hypothetic|motive|intuition|assume|doubt|suspicion|confidence|credibility/],
    ['quality',/first-class|second-class|third-class|successful|dazzling|mediocre|moderate|drastic|absolute|striking|distinctive|understate|play down|best possible|disastrous|bleak|precarious|dampened/],
    ['age',/to age|birthrate/], ['down',/abate|declining|impoverished/], ['up',/become more expensive|become more frequent/],
    ['material',/immaterial|material/],
    ['math',/unknown quantity|even \(a number\)|odd \(a number\)|single-digit|three-digit|roughly/],
    ['book',/teach someone the basics|ultimate answer|organically|kitsch|Idylle|debut/],
    ['money',/speculator|squander|rolling in|skimp|live on|gross domestic product/],
    ['filter',/selective|check or request|fetch or retrieve|ausschließlich|ausklammern|ausschließen|Fragmentierung|Polarisierung/],
    ['path',/deviate|coincide|build on|anknüpfen|verknüpfen|abdriften|durch.*ziehen|starting from/]
  ];
  function conceptScene(k,e,labels){
    const word=e.term||e.w||'', meaning=(e.en||[])[0]||'';
    if(k==='triangle')return p('M77 139L151 45L225 139Z','fill="none" stroke="var(--va-coral)" stroke-width="4"')+person(77,142,{scale:.7,skin:1})+person(151,48,{scale:.7,skin:2})+person(225,142,{scale:.7,skin:0});
    if(k==='sugar')return c(151,99,52,'var(--va-paper)')+p('M123 79H177V135H123Z','fill="var(--va-peach)"')+p('M123 79L150 58L177 79L150 101Z','fill="var(--va-tint)"')+line(150,101,150,133)+c(93,142,13,'var(--va-coral)');
    if(k==='cleaning')return p('M74 105H173L158 165H89Z','fill="var(--va-tint)"')+p('M89 105Q123 51 159 105','fill="none"')+p('M196 36L173 139L208 150L229 46Z','fill="var(--va-paper)"')+p('M173 139L160 169H205L208 150','fill="var(--va-peach)"')+p('M78 47v24m-12-12h24','stroke="var(--va-ac)" stroke-width="3"');
    if(k==='home')return p('M51 101L150 29L249 101M75 92V169H224V92','fill="var(--va-paper)"')+r(95,117,111,38,'var(--va-tint)',12)+person(150,121,{scale:.65,skin:1});
    if(k==='eyes')return p('M63 97Q151 25 239 97Q151 167 63 97Z','fill="var(--va-paper)"')+c(151,97,27,'var(--va-ac)')+c(151,97,11,'var(--va-ink)')+p('M73 157L232 37','stroke="var(--va-coral)" stroke-width="7"');
    if(k==='label')return r(82,39,136,124,'var(--va-tint)',18)+c(151,86,25,'var(--va-paper)')+p('M137 86l10 10 20-25','fill="none" stroke="var(--va-ac)" stroke-width="4"')+line(112,137,189,137);
    if(k==='hectare')return p('M66 58H231V159H66Z','fill="var(--va-mint)"')+Array.from({length:6},(_,i)=>line(80+i*26,61,80+i*26,155,'stroke="var(--va-paper)"')).join('')+(labels?t(150,41,'100 m',13)+t(150,183,'100 m × 100 m',13):'')+line(66,169,231,169);
    if(k==='cloudy')return p('M94 35H210L196 160H107Z','fill="var(--va-paper)"')+p('M99 78H205L196 159H107Z','fill="var(--va-tint)"')+[[125,94],[177,108],[146,138],[181,140],[123,122]].map(([x,y])=>c(x,y,6,'var(--va-peach)')).join('');
    if(k==='animal'&&/pack/.test(meaning))return [89,151,213].map((x,i)=>`<g transform="translate(${x} ${95+(i===1?-17:9)})">${p('M-27 -9L-30 -46L-9 -28L9 -28L30 -46L27 -9L0 26Z','fill="var(--va-tint)"')}${c(-11,-9,3,'var(--va-ink)')}${c(11,-9,3,'var(--va-ink)')}${p('M-6 7H6L0 14Z','fill="var(--va-ink)"')}</g>`).join('');
    if(k==='math'&&/even|odd/.test(meaning)){const odd=/odd/.test(meaning);return [75,125].map(x=>[65,115].map(y=>c(x,y,16,'var(--va-ac)')).join('')).join('')+(odd?c(209,89,16,'var(--va-coral)'):'')+p('M55 144H145','stroke="var(--va-tint)" stroke-width="7"')+(labels?t(151,180,odd?'2 + 2 + 1':'2 + 2',18):'');}
    if(k==='math'&&/digit/.test(meaning)){const x=/three/.test(meaning)?3:1;return r(62,57,176,87,'var(--va-paper)',12)+t(150,114,x===3?'728':'7',41);}
    if(['eat','sad','joy','anger','speech','animal','body','medicine','machine','network','money','book','time','math','thought','up','down','energy','democracy','empathy'].includes(k))return scene({kind:k,where:/ureter|metabol|digest|intestin/.test(meaning)?'belly':/larynx/.test(meaning)?'neck':/bicep/.test(meaning)?'arm':/mandible/.test(meaning)?'mouth':/pinna/.test(meaning)?'ear':'nose'},e,false);
    if(k==='idiom'){
      if(/Katze/.test(word))return p('M106 101L94 161Q153 184 213 160L197 101Z','fill="var(--va-peach)"')+p('M128 96V56L146 70L166 69L185 53V100Q158 117 128 96Z','fill="var(--va-paper)"')+c(145,87,3,'var(--va-ink)')+c(169,87,3,'var(--va-ink)')+p('M145 102L155 92L166 102','fill="none"')+arr(223,100,242,47);
      if(/Faden/.test(word))return c(94,111,37,'var(--va-tint)')+p('M61 99Q111 71 126 106Q89 142 68 122M66 90Q108 112 123 131M91 74L82 144M127 112H167M191 112H240','fill="none" stroke="var(--va-ac)"')+p('M171 99l5 24m8-23-4 24','stroke="var(--va-coral)"')+t(194,70,'?',24);
      if(/Brille/.test(word))return conceptScene('glasses',e,labels);
      if(/Himmel/.test(word))return p('M68 130Q40 97 80 87Q78 51 116 57Q140 22 166 57Q205 44 212 81Q250 78 249 113Q248 139 212 139H77Z','fill="var(--va-paper)"')+person(153,98,{skin:2,arm:true})+t(151,168,'7',24);
      if(/Korb/.test(word))return p('M88 98H216L200 162H105Z','fill="var(--va-peach)"')+p('M107 98Q152 26 198 98M114 111L127 153M148 107V157M186 111L174 153','fill="none"')+p('M128 44l33 28m-31 0 30-28','fill="none" stroke="var(--va-coral)" stroke-width="5"');
      return c(150,98,62,'var(--va-paper)')+c(150,98,32,'var(--va-tint)')+line(150,98,203,65)+p('M74 51l-13 -12M229 135l17 13M215 42l14-14','stroke="var(--va-coral)"')+t(151,151,'!',20);
    }
    if(k==='dilution')return p('M60 55H123L117 145H68Z','fill="var(--va-paper)"')+p('M65 81H120L116 144H69Z','fill="var(--va-ac)"')+arr(133,110,166,110)+p('M185 55H249L241 145H194Z','fill="var(--va-paper)"')+p('M190 80H246L241 144H194Z','fill="var(--va-tint)"')+p('M151 26Q129 52 151 61Q172 52 151 26Z','fill="var(--va-mint)"');
    if(k==='spool')return c(177,104,56,'var(--va-tint)')+c(177,104,28,'var(--va-paper)')+p('M123 105H88Q46 112 66 147Q88 173 106 149Q116 130 98 123','fill="none" stroke="var(--va-ac)" stroke-width="4"')+p('M169 46Q231 57 235 115','fill="none"')+arr(234,100,235,115);
    if(k==='tilt')return r(49,78,46,78,'var(--va-tint)',4)+`<g transform="rotate(35 219 155)">${r(177,78,46,78,'var(--va-ac)',4)}</g>`+arr(118,105,159,127)+line(41,164,263,164);
    if(k==='drink')return p('M113 36H190L180 114Q151 136 123 114Z','fill="var(--va-paper)"')+p('M117 69H186L179 113Q151 132 124 113Z','fill="var(--va-coral)" stroke="none"')+line(151,126,151,163)+line(122,165,181,165)+p('M217 48l-9 23 19-3-10 23','fill="none" stroke="var(--va-ac)"');
    if(k==='silence')return person(151,119,{skin:1})+bubble(189,32,'var(--va-tint)')+p('M193 48l37 17m-37 0 37-17','stroke="var(--va-coral)"');
    if(k==='envelope')return r(65,57,172,105,'var(--va-paper)',12)+p('M67 64L151 119L235 64M65 157L124 103M237 157L179 103','fill="none"')+arr(199,32,256,32);
    if(k==='glasses')return c(108,94,35,'var(--va-coral)')+c(196,94,35,'var(--va-coral)')+p('M143 91Q151 80 161 91M72 84L52 67M231 84L251 67','fill="none"')+p('M97 76L117 114M187 76L204 114','stroke="var(--va-paper)" stroke-opacity=".6"');
    if(k==='face')return scene({kind:'face'},e,false)+(/wrinkle/.test(meaning)?p('M117 74Q151 64 186 74M122 67Q151 58 180 67','fill="none" stroke-width="1.3"'): /pout/.test(meaning)?p('M137 116Q151 111 165 116L151 125Z','fill="var(--va-coral)"'): /crooked/.test(meaning)?line(152,80,164,106):'');
    if(k==='cloth')return line(66,45,238,45)+p('M86 44H211V149L184 162L160 150L136 162L111 150L86 162Z','fill="var(--va-tint)"')+[103,128,153,178,202].map(x=>line(x,48,x,145,'stroke="var(--va-paper)"')).join('')+[73,98,123].map(y=>line(90,y,205,y,'stroke="var(--va-paper)"')).join('');
    if(k==='swing')return line(95,21,95,130)+line(204,21,204,130)+r(84,127,132,15,'var(--va-ac)',8)+p('M61 158Q150 193 244 158','fill="none"')+arr(223,159,244,158);
    if(k==='tree')return line(149,82,149,149)+p('M88 96L152 32L213 96Z','fill="var(--va-mint)"')+p('M146 133l12 10m-12 0 12-10','stroke="var(--va-coral)" stroke-width="5"')+arr(211,81,251,115);
    if(k==='farm')return /liquid manure/.test(meaning)?r(85,70,130,86,'var(--va-peach)',20)+r(123,47,55,24,'var(--va-tint)',7)+p('M97 102Q151 78 203 104','fill="none"')+p('M232 110Q212 134 231 143Q251 135 232 110Z','fill="var(--va-ac)"'): /fish meal/.test(meaning)?p('M109 45H192L217 161H84Z','fill="var(--va-peach)"')+p('M113 101Q151 74 177 101Q150 132 113 101L99 82V121Z','fill="var(--va-paper)"')+c(167,98,3,'var(--va-ink)'):scene({kind:'crop'},e,false);
    if(k==='digestion')return p('M123 29V70Q92 62 97 99Q101 125 153 125Q207 125 204 150Q199 168 113 159Q85 158 96 140Q103 132 156 145Q189 151 191 139','fill="none" stroke="var(--va-coral)" stroke-width="12"')+p('M127 71Q156 46 177 78Q191 104 161 116','fill="var(--va-peach)"')+arr(227,61,227,137);
    if(k==='microbe')return c(151,96,48,'var(--va-mint)')+[0,45,90,135,180,225,270,315].map(a=>`<g transform="rotate(${a} 151 96)">${line(151,36,151,22)}${c(151,20,4,'var(--va-coral)')}</g>`).join('')+c(135,81,7,'var(--va-paper)')+c(172,102,9,'var(--va-paper)')+c(139,119,5,'var(--va-ac)');
    if(k==='porous')return r(70,42,164,120,'var(--va-peach)',18)+[[98,69,13],[149,74,20],[201,67,10],[107,124,17],[181,125,23]].map(([x,y,z])=>c(x,y,z,'var(--va-paper)')).join('');
    if(k==='rays')return c(151,96,24,'var(--va-coral)')+[0,45,90,135,180,225,270,315].map(a=>`<g transform="rotate(${a} 151 96)">${arr(151,59,151,29)}</g>`).join('');
    if(k==='coagulate')return [79,151,225].map((x,i)=>c(x,98,i===2?28:15,i===2?'var(--va-coral)':'var(--va-peach)')).join('')+arr(105,98,123,98)+arr(176,98,193,98)+[[-9,-9],[9,-9],[0,9]].map(([x,y])=>c(225+x,98+y,5,'var(--va-paper)')).join('');
    if(k==='access')return c(117,119,38,'var(--va-paper)')+c(130,47,12,'var(--va-peach)')+p('M129 65V108H173L196 145M128 83H166','fill="none" stroke="var(--va-ac)" stroke-width="9"')+p('M59 168H220L255 134','fill="none"');
    if(k==='balance')return scene({kind:'law'},e,false)+t(150,188,'=',18);
    if(k==='obstacle')return person(94,116,{walk:true,skin:2})+r(163,77,24,83,'var(--va-coral)',4)+p('M130 67Q180 15 218 65','fill="none" stroke-dasharray="5 5"')+arr(213,57,218,65);
    if(k==='document')return r(91,27,132,145,'var(--va-paper)',10)+[60,82,104,126,148].map((y,i)=>line(111,y,i===4?166:202,y,'stroke="var(--va-ac)"')).join('')+p('M71 122L124 63L140 79L86 137L64 144Z','fill="var(--va-peach)"');
    if(k==='roof')return p('M48 103L151 32L253 103Z','fill="var(--va-coral)"')+p('M65 105H236V166H65Z','fill="var(--va-paper)"')+[74,94,114].map(y=>line(96-y/2,y,211+y/4,y,'stroke="var(--va-peach)"')).join('')+r(133,123,35,43,'var(--va-ac)',3);
    if(k==='measure')return r(52,67,202,58,'var(--va-paper)',6)+Array.from({length:11},(_,i)=>line(66+i*17,69,66+i*17,i%5?84:97)).join('')+arr(68,150,235,150);
    if(k==='cycle')return p('M88 70Q148 8 217 75M217 123Q150 188 84 121','fill="none" stroke="var(--va-ac)" stroke-width="6"')+arr(209,60,217,75)+arr(94,135,84,121)+c(150,96,24,'var(--va-paper)')+t(150,104,'↻',25);
    if(k==='evidence')return r(66,38,124,124,'var(--va-paper)',10)+[65,88,111,134].map(y=>line(87,y,168,y,'stroke="var(--va-tint)"')).join('')+c(205,109,33,'var(--va-tint)')+p('M188 110l11 11 23-29','fill="none" stroke="var(--va-ac)" stroke-width="5"');
    if(k==='isolation')return [76,125,174].map((x,i)=>person(x,119,{scale:.7,skin:i})).join('')+line(209,36,209,163,'stroke-dasharray="5 5"')+person(249,119,{scale:.7,skin:1});
    if(k==='location')return p('M48 142L113 117L183 139L249 113V157L184 179L114 159L48 180Z','fill="var(--va-tint)"')+p('M151 140Q102 88 118 61Q150 26 182 61Q199 91 151 140Z','fill="var(--va-ac)"')+c(151,77,16,'var(--va-paper)');
    if(k==='flow')return [59,121,183,245].map((x,i)=>r(x-20,81,40,40,i%2?'var(--va-tint)':'var(--va-paper)',8)+(i<3?arr(x+25,101,x+36,101):'')).join('');
    if(k==='speed')return c(166,105,57,'var(--va-paper)')+line(166,105,195,67)+c(166,105,7,'var(--va-ac)')+line(62,76,107,76)+line(48,101,92,101)+line(68,126,107,126);
    if(k==='quality')return [79,151,223].map((x,i)=>r(x-21,131-i*34,42,35+i*34,i===2?'var(--va-ac)':'var(--va-tint)',5)).join('')+line(48,167,255,167);
    if(k==='age')return person(99,119,{scale:.7,skin:2})+arr(137,94,173,94)+person(219,115,{scale:1.2,skin:1})+line(59,163,260,163);
    if(k==='material')return r(64,62,72,86,'var(--va-ac)',8)+r(174,62,72,86,'none',8).replace('/>',' stroke="var(--va-ink)" stroke-dasharray="4 6"/>')+t(153,110,'≠',24);
    if(k==='filter')return p('M69 39H235L172 105V160L133 178V105Z','fill="var(--va-paper)"')+[103,150,199].map((x,i)=>c(x,63,7,i===1?'var(--va-ac)':'var(--va-coral)')).join('')+c(152,124,7,'var(--va-ac)');
    if(k==='path')return p('M52 143Q112 45 163 110T248 63','fill="none" stroke="var(--va-ac)" stroke-width="5"')+c(52,143,12,'var(--va-paper)')+c(248,63,12,'var(--va-peach)')+p('M118 71L171 142','fill="none" stroke="var(--va-coral)" stroke-dasharray="4 6"');
    return scene({kind:k},e,false);
  }

  function spec(e) {
    if(e.visual)return e.visual;
    const lemma=(e.term||e.w||'').replace(/^(?:etw\.|jmdn\.|jmdm\.|sich)\s+/,'');
    const special={hager:'thin',schmächtig:'slight',schlaksig:'lanky',gedrungen:'stocky',falsifizieren:'refute',verifizieren:'verify',empirisch:'observe',dogmatisch:'dogma',Legislative:'legislature',Exekutive:'executive',Judikative:'judiciary',Gewaltenteilung:'separation',abbuchen:'debit',gutschreiben:'credit',Gutschrift:'credit',Dauerauftrag:'standing-order',Dividende:'dividend',Zins:'interest',zinslos:'zero-interest',zinsfrei:'zero-interest',intravenös:'intravenous',intramuskulär:'intramuscular'};
    if(special[lemma])return {kind:'precise',detail:special[lemma]};
    const object=objects[e.term||e.w]||(/Kreiszahl/.test(e.term||'')?'pi':null);
    if(object)return {kind:'object',object,caption:(e.en||[])[0]||''};
    const overrides=[
      ['furniture',/^(Schaukelstuhl|Eckbank)$/],['face',/^(wohlgenährt|makellos)$/],
      ['joy',/Honigkuchenpferd|Partylöwe|Stimmungskanone/],['sad',/Kopf hängen|niedergeschlagen/],
      ['sleep',/^(Frühaufsteher|Frühaufsteherin|Nachteule)$/],['thought',/Intelligenzbestie|Gemüt|empfindungsfähig|sich etw. vor Augen|glasklar/],
      ['speech',/jmdn. beschimpfen|nicht auf den Mund gefallen/],['network',/Kontakt pflegen|Suchbegriff|verzweigt/],
      ['law',/Verteilungsgerechtigkeit|jmdn. bestechen/],['work',/Führungskompetenz|erwerbsfähig/],
      ['time',/nächstmöglich|frühestmöglich|Jahrgang|Quartal/],['transport',/Reederei|Werft|Warenumschlagplatz|Umstieg|etw. vertreiben/],
      ['machine',/^Maschinen$|etw. antreiben|etw. einziehen/],['math',/^Fläche$/],
      ['book',/abgedroschen|^Disziplin$/],['concept-triangle',/^Dreiecksbeziehung$/],['logic',/etw. erbringen|etw. liefern|zu etw. gelangen/],
      ['democracy',/^rechts$|einbringen|kommunalisieren|Kommunalisierung/],
      ['empathy',/bedauern|jmdm. etw. entgegenbringen/],['sad',/jmdn. befallen|jmdn. überfallen/],
      ['target',/Interesse an etw. wecken/],['thought',/außer Acht lassen/],['logic',/Berechenbarkeit|Nachvollziehbarkeit|Vorhersagbarkeit|Realisierbarkeit/],['down',/^schrumpfen$|Preisverfall/],['eat',/in sich hineinschaufeln/],['money',/Geld|Einzugsermächtigung|börsennotiert/],['volatile',/^labil$/],['flat',/^konstant$/],['thought',/etw. ermitteln/],['joy',/^erfrischend$/],['medicine',/^Magersucht$/]
    ];
    const fixed=overrides.find(([,rx])=>rx.test(e.term||e.w||''));
    if(fixed)return fixed[0]==='concept-triangle'?{kind:'concept',detail:'triangle'}:{kind:fixed[0]};
    const meaning=(e.en||[]).join(' · '), raw=(e.term||e.w||'')+' '+meaning;
    let kind=(rules.find(([,rx])=>rx.test(meaning))||['meaning'])[0];
    const concept=kind==='meaning'&&conceptRules.find(([,rx])=>[raw,meaning,(e.en||[])[0]||''].some(text=>rx.test(text)));
    if(concept)return {kind:'concept',detail:concept[0]};
    let where='chest';
    for(const [k,rx] of Object.entries({head:/skull|head|brain|gehirn|temple/i,brain:/brain/i,eye:/eye/i,ear:/ear|ohr/i,nose:/nose|nasal/i,mouth:/jaw|kiefer/i,neck:/throat|thyroid|neck|kehlkopf|schilddrüse/i,shoulder:/collarbone|shoulder/i,arm:/bicep|bizeps|arm/i,hip:/hip|hüfte/i,belly:/navel|spleen|metaboli|digest|darm|milz|intestin|belly/i,back:/spine|spinal|vertebr|tailbone/i,leg:/calf|shin|wade|schienbein/i,foot:/achilles|heel|foot/i,skin:/pore|skin|tissue/i}))if(rx.test(raw))where=k;
    return {kind,where,caption:meaning.split(';')[0].slice(0,85)};
  }
  function scene(v,e={},labels=true) {
    const kind=v.kind, meaning=(e.en||[])[0]||'', word=e.term||e.w||'';
    let s='';
    if(kind==='precise'){
      const k=v.detail;
      if(['thin','slight','lanky','stocky'].includes(k)){
        const sx=k==='stocky'?1.25:k==='lanky'?.7:k==='slight'?.64:.7,sy=k==='lanky'?1.3:k==='slight'?.8:k==='stocky'?.86:1.1;
        s=`<g transform="translate(150 120) scale(${sx} ${sy})">${person(0,0,{skin:2})}</g>`+line(71,162,226,162)+p('M81 48V151M75 48H87M75 151H87','fill="none" stroke="var(--va-ac)"');
      }else if(k==='refute'||k==='verify'||k==='observe'){
        s=r(57,28,187,37,'var(--va-paper)',8)+t(150,52,labels?'Hypothese':'?',15)+arr(151,70,151,91)+[83,126,170,213].map((x,i)=>c(x,123,14,(k==='refute'&&i===3)?'var(--va-coral)':'var(--va-mint)')+p((k==='refute'&&i===3)?`M${x-5} 118l10 10m-10 0 10-10`:`M${x-7} 124l5 5 10-12`,'fill="none"')).join('')+(k==='observe'?p('M57 164Q151 195 244 164','fill="none"'):'');
      }else if(k==='dogma')s=book(151,77)+c(151,52,22,'var(--va-ac)')+t(151,59,'!',23)+p('M229 49V145M219 60l10 -11 10 11','fill="none"');
      else if(['legislature','executive','judiciary','separation'].includes(k)){
        const hi={legislature:0,executive:1,judiciary:2,separation:-1}[k];
        s=p('M54 52L150 21L247 52Z','fill="var(--va-tint)"')+[84,150,216].map((x,i)=>r(x-14,62,28,80,hi===i?'var(--va-ac)':'var(--va-paper)',3)+(labels?t(x,166,['Gesetz','Regierung','Gericht'][i],10):'')).join('')+r(48,145,205,10,'var(--va-tint)',3);
      }else if(k==='intravenous'||k==='intramuscular'){
        s=p('M67 72Q123 28 181 62L243 140Q226 160 203 148L147 97L107 125Q72 127 67 72Z','fill="var(--va-peach)"')+(k==='intravenous'?p('M93 112Q119 75 149 80L212 133','fill="none" stroke="var(--va-ac)" stroke-width="5"'):p('M102 72Q131 55 162 77L190 113Q152 103 131 94Z','fill="var(--va-coral)"'))+p('M154 54L130 90M164 37L178 46L160 73L145 64Z','fill="var(--va-paper)"')+line(163,32,182,45);
      }else{
        const incoming=k==='credit'||k==='dividend',outgoing=k==='debit';
        s=r(65,57,172,112,'var(--va-paper)',13)+r(84,77,133,24,'var(--va-tint)',4)+t(150,95,k==='standing-order'?'↻':k==='zero-interest'?'0 %':k==='interest'?'%':incoming?'+ €':outgoing?'− €':'€',20)+[0,1,2].map(i=>line(91,119+i*14,200-i%2*37,119+i*14)).join('')+coin(incoming?44:257,123,1.15)+(incoming?arr(65,123,91,123):outgoing?arr(212,123,243,123):k==='interest'?c(252,48,24,'var(--va-gold)')+t(252,55,'%',24):'');
      }
    }
    else if(kind==='concept')s=conceptScene(v.detail,e,labels);
    else if(kind==='object'){
      s=objectScene(v.object);
      if(!s){const alias={whisk:'kitchen',processor:'kitchen',pan:'kitchen',drill:'tool',shovel:'tool','power-strip':'tool',level:'tool'};s=scene({kind:alias[v.object]||'meaning'},e,false);}
    }
    else if(kind==='body')s=body(v.where,labels?meaning.split(',')[0].slice(0,17):'');
    else if(['up','down','flat','volatile'].includes(kind))s=chart(kind);
    else if(kind==='math') {
      if(/multiplication|times table|basic knowledge/.test(meaning))return r(61,23,180,150,'var(--va-paper)',8)+[1,2].map(i=>line(61+i*60,23,61+i*60,173)+line(61,23+i*50,241,23+i*50)).join('')+[1,2,3].map((row,i)=>[1,2,3].map((col,j)=>t(91+j*60,56+i*50,String(row*col),22)).join('')).join('');
      if(/volume/.test(meaning))return p('M91 69L155 35L220 69V139L155 174L91 139Z','fill="var(--va-tint)"')+p('M91 69L155 103L220 69M155 103V174','fill="none"')+p('M155 35V106M92 139L155 106L220 139','fill="none" stroke-dasharray="3 6"')+t(155,196,'a × b × c',15);
      if(/angle/.test(meaning))return p('M58 149H243M83 149L203 46M128 149Q125 121 110 126','fill="none"')+p('M174 47H239V114M219 47V67H239','fill="none" stroke="var(--va-ac)"')+t(145,130,'α',23);
      if(/roughly/.test(meaning))return t(150,98,'≈',67)+line(70,141,231,141)+[0,1,2,3,4,5,6].map(i=>line(70+i*26,136,70+i*26,148)).join('');
      if(/area|surface/i.test(meaning))return r(79,37,144,120,'var(--va-tint)',2)+[1,2,3].map(i=>line(79+i*36,37,79+i*36,157)).join('')+[1,2].map(i=>line(79,37+i*40,223,37+i*40)).join('');
      if(/denominator|numerator/i.test(meaning))s=t(150,65,'3',35)+line(127,78,174,78)+t(150,119,'4',35)+c(/numerator/i.test(meaning)?150:150,/numerator/i.test(meaning)?53:108,24,'none')+arr(67,/numerator/i.test(meaning)?53:108,118,/numerator/i.test(meaning)?53:108);
      else if(/equation|unknown/i.test(meaning))s=r(45,53,210,72,'var(--va-paper)',14)+t(150,100,'2x + 3 = 11',24);
      else if(/square|Quadrat/i.test(word+' '+meaning))s=r(89,39,108,108,'var(--va-tint)',2)+[1,2].map(i=>line(89+i*36,39,89+i*36,147)+line(89,39+i*36,197,39+i*36)).join('');
      else if(/angle/i.test(meaning))s=p('M65 47V139H219','fill="none"')+p('M65 115H89V139','fill="none" stroke="var(--va-ac)"')+t(118,119,'90°',18);
      else s=c(150,92,58,'var(--va-tint)')+c(150,92,3,'var(--va-ink)')+line(/diameter/i.test(meaning)?92:150,92,208,92)+(/circumference/i.test(meaning)?c(150,92,62,'none'):'')+t(176,84,/diameter/i.test(meaning)?'d':'r',15);
    } else if(kind==='walk') {
      const limp=/limp|hobble/.test(meaning), slow=/sneak|creep/.test(meaning);
      s=(slow?`<g transform="rotate(-15 150 120) translate(0 13)">${person(155,112,{walk:true,skin:1})}</g>`:person(155,112,{walk:true,skin:1,arm:/march/.test(meaning)}))+line(60,148,251,148)+(limp?line(186,93,199,148)+p('M160 132l5 -7 6 5','fill="none" stroke="var(--va-coral)"'):arr(62,127,111,127))+[1,2,3].map(i=>r(62+i*37,158,14,4,'var(--va-tint)',2)).join('')+(slow?p('M116 61Q138 50 157 60','fill="none" stroke-dasharray="4 5"'):/march/.test(meaning)?p('M67 71h28m-18-7 8 14m-20-7 8 14','stroke="var(--va-ac)"'): /stroll/.test(meaning)?p('M218 53Q231 39 240 53Q237 69 218 70Z','fill="var(--va-mint)"'): '');
    } else if(['joy','sad','anger','fear','calm','envious','face'].includes(kind)) {
      const sad=kind==='sad', angry=kind==='anger';
      s=c(150,92,59,'var(--va-peach)')+p('M92 78Q83 29 130 28Q187 16 205 80L175 63L155 38Q135 66 92 78Z','fill="var(--va-ink)" stroke="none"')+c(130,87,3,'var(--va-ink)')+c(171,87,3,'var(--va-ink)')+p(sad?'M132 121Q150 105 169 121':angry?'M134 116H166':kind==='fear'?'M144 113Q150 102 157 113V125H144Z':'M129 111Q150 137 173 111','fill="none" stroke-width="3"')+(angry?line(121,73,137,79)+line(163,79,179,73):'')+(kind==='calm'?p('M124 87H137M165 87H178','stroke-width="4"'):kind==='joy'?p('M78 64l-10 -8M222 64l10 -8M76 103H61M224 103H239','stroke="var(--va-gold)"'):kind==='envious'?c(214,43,15,'var(--va-mint)'):'');
    } else if(kind==='empathy')s=person(102,120,{skin:2,sad:true})+person(201,120,{skin:1})+p('M133 101Q150 74 172 102','fill="none" stroke="var(--va-coral)"')+p('M137 48C137 33 152 32 153 45C160 31 173 36 169 48L152 64Z','fill="var(--va-coral)" stroke="none"');
    else if(kind==='sleep')s=r(66,93,165,42,'var(--va-tint)')+r(68,83,48,24,'var(--va-paper)')+line(63,71,63,151)+line(234,110,234,151)+c(96,92,15,'var(--va-peach)')+p('M113 94Q161 77 228 101V127H113Z','fill="var(--va-ac)" stroke="none"')+t(203,51,'z z',24);
    else if(kind==='eat')s=person(153,119,{skin:2})+r(65,126,171,10,'var(--va-paper)',5)+c(155,119,30,'var(--va-tint)')+c(155,119,19,'var(--va-paper)')+p('M113 93L136 106M199 92L177 106','stroke="var(--va-ink)"')+c(155,117,10,'var(--va-coral)');
    else if(kind==='furniture') {
      if(/table/i.test(meaning))s=p('M65 86L153 49L238 84L151 122Z','fill="var(--va-paper)"')+line(70,89,70,151)+line(233,89,233,151)+line(151,122,151,169);
      else if(/corner bench/i.test(meaning))s=p('M57 91L139 47L242 96V136L155 91L83 132Z','fill="var(--va-tint)"')+p('M58 125L139 82L240 129L210 150L139 114L86 144Z','fill="var(--va-ac)"')+line(67,132,67,163)+line(211,148,211,175)+line(139,111,139,145);
      else s=r(104,38,90,69,'var(--va-tint)',15)+r(95,101,112,29,'var(--va-ac)',10)+line(108,131,101,166)+line(194,131,202,166)+line(93,104,78,79)+line(207,104,222,79)+(/rocking/i.test(meaning)?p('M78 167Q149 188 221 167','fill="none"'):'' )+(/armrest/i.test(meaning)?p('M73 76H101M202 76H229','stroke="var(--va-coral)" stroke-width="8"'):'' )+(/backrest/i.test(meaning)?r(112,45,74,49,'var(--va-coral)',9):'');
    } else if(kind==='clothes') {
      s=p('M115 43L83 58L62 96L91 113L110 84V157H191V84L209 113L238 96L216 58L185 43Q149 68 115 43Z','fill="var(--va-tint)"')+line(151,64,151,154)+[75,91,107,123,139].map(y=>r(147,y,8,7,'var(--va-ac)',1)).join('')+(/lace|boot/i.test(meaning)?p('M102 74H170V118L215 132V157H101Z','fill="var(--va-peach)"'):'' );
    } else if(kind==='kitchen') {
      if(/whisk|cream/i.test(meaning))s=p('M70 104Q79 163 151 163Q224 163 231 104Z','fill="var(--va-tint)"')+p('M147 110L192 40M137 113Q127 83 169 61M152 117Q184 111 178 71','fill="none"')+c(145,104,7,'var(--va-paper)');
      else if(/blender|processor|puree|purée/i.test(meaning))s=r(100,127,101,34,'var(--va-ac)',8)+p('M110 48H190L184 128H117Z','fill="var(--va-paper)"')+r(104,38,93,12,'var(--va-ac)',4)+p('M119 103Q150 81 184 105V126H119Z','fill="var(--va-mint)"')+line(137,115,166,115)+c(150,144,5,'var(--va-paper)');
      else s=p('M71 101Q84 151 162 142Q218 137 215 97Z','fill="var(--va-tint)"')+p('M211 99L259 78','stroke-width="12"')+c(146,104,25,'var(--va-paper)')+c(147,103,12,'var(--va-gold)');
    } else if(kind==='tool') {
      if(/drill/i.test(meaning))s=p('M84 57H169L186 73L172 100H146L133 145H101L111 96H84Z','fill="var(--va-ac)"')+line(185,74,235,74)+p('M194 68l8 12 9 -12 9 12','fill="none"');
      else if(/shovel/i.test(meaning))s=line(150,41,150,121)+p('M132 31V45Q150 58 168 45V31Z','fill="var(--va-paper)"')+p('M128 115H173V143Q150 177 128 143Z','fill="var(--va-tint)"');
      else if(/power strip|socket/i.test(meaning))s=r(52,71,200,57,'var(--va-paper)',18)+[91,151,211].map(x=>c(x,99,18,'var(--va-tint)')+c(x-5,99,2,'var(--va-ink)')+c(x+5,99,2,'var(--va-ink)')).join('');
      else s=r(73,71,164,51,'var(--va-tint)',7)+r(95,93,111,12,'var(--va-paper)',5)+c(150,98,7,'var(--va-mint)')+gear(157,94);
    } else if(kind==='speech')s=person(82,128,{skin:2})+person(226,128,{skin:1})+bubble(105,29)+line(117,53,154,53)+line(117,64,143,64);
    else if(kind==='network')s=[[-78,-42],[77,-40],[-77,47],[78,47]].map(([x,y],i)=>line(150,95,150+x,95+y)+c(150+x,95+y,21,'var(--va-tint)')+c(150+x,89+y,5,'var(--va-ac)')+p(`M${139+x} ${107+y}Q${150+x} ${89+y} ${161+x} ${107+y}`,'fill="var(--va-ac)" stroke="none"')).join('')+c(150,95,30,'var(--va-ac)')+p('M136 95H164M150 81V109','stroke="var(--va-paper)"');
    else if(kind==='crop')s=p('M34 140Q147 96 269 145V173H34Z','fill="var(--va-mint)" stroke="none"')+[75,150,224].map((x,i)=>line(x,143,x,69+i*8)+p(`M${x} 113Q${x-40} 74 ${x-3} 90M${x} 100Q${x+39} 62 ${x+3} 80`,'fill="var(--va-mint)"')).join('')+c(235,33,15,'var(--va-gold)');
    else if(kind==='animal') {
      const bird=/bird|chicken|poultry|turkey|duck|goose|pigeon|quack|chirp|cluck|coo/i.test(meaning), bee=/bee|insect|buzz/i.test(meaning), cow=/cow|cattle|milking/i.test(meaning);
      if(/sheep|bleat/.test(meaning))s=[c(100,95,27,'var(--va-paper)'),c(129,73,29,'var(--va-paper)'),c(165,73,28,'var(--va-paper)'),c(182,102,31,'var(--va-paper)'),c(151,120,31,'var(--va-paper)'),c(111,121,26,'var(--va-paper)')].join('')+r(186,86,35,51,'var(--va-ink)',15)+c(210,103,3,'var(--va-paper)')+line(106,141,103,165)+line(176,144,179,165);
      else if(/dog|bark|yap/.test(meaning))s=r(80,94,109,43,'var(--va-peach)',15)+p('M178 110L192 63L215 74L225 116L206 128Z','fill="var(--va-peach)"')+p('M191 65L173 62L176 104Z','fill="var(--va-ink)"')+c(213,91,3,'var(--va-ink)')+line(85,102,61,82)+line(91,134,86,163)+line(175,133,181,163)+p('M222 108h15','stroke-width="7"');
      else if(/pig|grunt|squeak/.test(meaning))s=r(77,77,142,71,'var(--va-peach)',35)+p('M184 79L191 52L212 78','fill="var(--va-coral)"')+c(213,112,24,'var(--va-coral)')+c(206,111,3,'var(--va-ink)')+c(219,111,3,'var(--va-ink)')+c(194,90,3,'var(--va-ink)')+p('M79 101Q50 82 53 105Q69 119 70 99','fill="none"')+line(103,145,103,164)+line(185,146,185,165);
      else if(/frog|croak/.test(meaning))s=c(151,119,46,'var(--va-mint)')+c(122,83,21,'var(--va-mint)')+c(179,83,21,'var(--va-mint)')+c(122,81,7,'var(--va-paper)')+c(178,81,7,'var(--va-paper)')+c(123,80,3,'var(--va-ink)')+c(178,80,3,'var(--va-ink)')+p('M122 119Q151 142 181 119M111 143L82 162H115M188 143L219 162H187','fill="none"');
      else if(bird)s=p('M94 106Q66 78 88 63Q113 78 124 90Q165 53 190 78Q221 110 177 132Q121 149 94 106Z','fill="var(--va-tint)"')+c(190,65,21,'var(--va-paper)')+p('M208 60L227 71L208 78Z','fill="var(--va-gold)"')+c(194,61,3,'var(--va-ink)')+line(143,134,142,158)+line(169,135,171,158)+(/chicken|cluck/.test(meaning)?p('M177 46Q166 22 184 30Q192 13 199 32Q219 26 204 49','fill="var(--va-coral)"'):'' );
      else if(bee)s=c(131,64,22,'var(--va-paper)')+c(174,64,22,'var(--va-paper)')+r(107,74,90,49,'var(--va-gold)',25)+line(134,78,134,119)+line(160,78,160,119)+c(185,92,3,'var(--va-ink)');
      else s=r(77,71,122,69,'var(--va-paper)',24)+c(202,94,32,'var(--va-peach)')+p('M183 72L172 45L197 64M213 65L230 46L226 83','fill="var(--va-tint)"')+[94,123,174].map(x=>line(x,137,x,161)).join('')+c(211,89,3,'var(--va-ink)')+(cow?p('M112 78Q157 65 150 100Q114 114 112 78Z','fill="var(--va-ink)" stroke="none"'):p('M216 105Q235 92 236 107Q232 122 217 114Z','fill="var(--va-coral)"'));
      if(/bark|bleat|grunt|cluck|\bcoo(?:ing)?\b|croak|squeak|quack|chirp|buzz|sound/i.test(meaning))s+=p('M248 76Q259 95 248 114M258 65Q277 95 258 125','fill="none" stroke="var(--va-ac)"');
    } else if(kind==='food')s=c(150,102,67,'var(--va-paper)')+c(150,102,51,'var(--va-tint)')+(/cinnamon|biscuit|cookie|vanilla|doughnut|cake|glaze/i.test(meaning)?p('M115 128V84L150 60L194 88V128Z','fill="var(--va-peach)"')+p('M115 84Q133 103 150 79Q170 105 194 88','fill="none" stroke="var(--va-paper)" stroke-width="8"'):c(146,113,28,/beet/i.test(meaning)?'var(--va-coral)':'var(--va-gold)')+p('M147 90Q110 56 135 43L151 85Q170 38 190 54Q178 85 151 90Z','fill="var(--va-mint)"'));
    else if(kind==='ecology')s=c(150,99,65,'var(--va-tint)')+p('M98 91L124 70L145 77L135 105L111 113M184 48L176 77L200 91L185 127L171 145','fill="var(--va-mint)" stroke="none"')+p('M82 145Q150 191 226 139M71 127Q42 48 117 25','fill="none" stroke="var(--va-ac)"')+p('M222 125L226 139L210 140M103 23L117 25L112 41','fill="none"');
    else if(kind==='work')s=r(79,92,146,50,'var(--va-paper)',12)+r(127,73,50,19,'var(--va-ac)',4)+person(87,83,{scale:.7,skin:1})+person(155,71,{scale:.8,skin:2})+person(224,84,{scale:.7,skin:0})+line(100,141,96,169)+line(208,141,212,169)+t(152,126,'✓',23);
    else if(kind==='medicine')s=r(95,33,112,128,'var(--va-paper)',17)+r(123,23,55,18,'var(--va-tint)',5)+p('M137 77H165M151 63V91','stroke="var(--va-ac)" stroke-width="9"')+line(118,116,184,116)+line(118,132,169,132)+c(219,132,18,'var(--va-mint)')+p('M210 132l6 6 12 -15','fill="none"');
    else if(kind==='illness')s=body(/brain|stroke/.test(meaning)?'brain':/blood|heart/.test(meaning)?'chest':'belly','')+p('M224 56L249 103H199Z','fill="var(--va-coral)" stroke="none"')+t(224,93,'!',25);
    else if(kind==='safety')s=p('M150 28L217 51V99Q210 142 150 168Q90 142 83 99V51Z','fill="var(--va-tint)"')+p('M112 96L139 120L188 70','fill="none" stroke="var(--va-ac)" stroke-width="8"');
    else if(kind==='machine')s=gear(123,89)+gear(192,117)+r(70,147,167,16,'var(--va-paper)',5)+r(66,47,24,86,'var(--va-ac)',5)+c(78,64,4,'var(--va-paper)');
    else if(kind==='energy')s=p('M161 24L106 99H145L136 166L201 79H161Z','fill="var(--va-gold)"')+r(48,121,46,41,'var(--va-tint)',3)+p('M43 121l28 -27 29 27','fill="var(--va-tint)"')+r(219,108,35,54,'var(--va-tint)',3)+line(95,145,127,145)+line(180,144,218,144);
    else if(kind==='transport')s=r(45,81,145,65,'var(--va-tint)',7)+r(192,103,53,43,'var(--va-ac)',5)+p('M197 104V80H221L241 103Z','fill="var(--va-paper)"')+c(82,147,14,'var(--va-ink)')+c(218,147,14,'var(--va-ink)')+c(82,147,6,'var(--va-paper)')+c(218,147,6,'var(--va-paper)')+arr(93,53,206,53);
    else if(kind==='law')s=line(150,43,150,156)+line(92,65,210,65)+p('M101 65L73 111H129ZM203 65L176 111H231Z','fill="var(--va-tint)"')+c(150,42,8,'var(--va-ac)')+r(112,151,76,12,'var(--va-paper)',4);
    else if(kind==='democracy')s=p('M77 52L151 22L227 52Z','fill="var(--va-tint)"')+[92,150,208].map(x=>r(x-9,61,18,75,'var(--va-paper)',3)).join('')+r(66,138,173,17,'var(--va-ac)',3)+r(190,102,57,56,'var(--va-paper)',5)+p('M211 95L229 78L246 95L228 113Z','fill="var(--va-tint)"')+p('M215 94l8 5 10 -12','fill="none"')+line(202,116,236,116);
    else if(kind==='ideology')s=person(90,123,{skin:1})+person(155,123,{skin:2})+person(220,123,{skin:0})+line(78,74,78,27)+p('M79 27H157L139 46H79Z','fill="var(--va-ac)"')+line(48,160,253,160);
    else if(kind==='book')s=book(152,71)+p('M80 38Q94 27 103 42M203 41Q215 25 229 35','fill="none" stroke="var(--va-ac)"')+c(222,65,6,'var(--va-gold)');
    else if(kind==='history')s=p('M118 37H183V54Q190 70 207 95Q222 125 196 153Q151 176 106 153Q80 125 96 95Q113 70 118 54Z','fill="var(--va-peach)"')+p('M105 108H199M112 126H192','stroke="var(--va-paper)"')+p('M133 44L144 87L127 126L142 157','fill="none" stroke="var(--va-coral)"');
    else if(kind==='population')s=[76,125,176,226].map((x,i)=>person(x,118,{scale:[.65,.9,.75,.5][i],skin:i})).join('')+line(49,156,250,156)+arr(81,41,215,41);
    else if(kind==='money') {
      if(/creditworthiness|credit.worthiness|credit rating/.test(meaning))s=p('M80 126A73 73 0 0 1 226 126','fill="none" stroke="var(--va-tint)" stroke-width="18"')+line(153,126,204,69)+c(153,126,10,'var(--va-ac)')+t(152,161,'AAA',19);
      else if(/spend|waste|extravag|squander/.test(meaning))s=r(52,74,85,69,'var(--va-tint)',9)+coin(82,103)+arr(145,100,202,100)+coin(234,82)+coin(227,128,.7);
      else if(/save|sting|frugal/.test(meaning))s=r(80,62,148,95,'var(--va-tint)',25)+line(133,74,175,74)+coin(153,37)+c(213,106,4,'var(--va-ink)')+p('M105 154V166M200 154V166','fill="none"');
      else s=r(62,61,175,104,'var(--va-paper)',13)+r(62,85,175,18,'var(--va-ac)',0)+coin(196,128,1.5)+t(115,137,'€',25)+r(81,41,102,20,'var(--va-tint)',6);
    } else if(kind==='time')s=c(151,95,64,'var(--va-paper)')+line(151,95,151,49)+line(151,95,188,111)+[0,90,180,270].map(a=>`<g transform="rotate(${a} 151 95)">${line(151,39,151,47)}</g>`).join('')+c(151,95,5,'var(--va-ac)');
    else if(kind==='target')s=c(152,99,66,'var(--va-tint)')+c(152,99,43,'var(--va-paper)')+c(152,99,19,'var(--va-ac)')+arr(68,41,151,99);
    else if(kind==='contrast')s=r(50,56,81,91,'var(--va-tint)',15)+r(169,56,81,91,'var(--va-paper)',15)+c(91,100,21,'var(--va-ac)')+c(210,100,21,'var(--va-coral)')+t(151,108,'≠',29);
    else if(kind==='cause')s=c(66,102,27,'var(--va-tint)')+arr(100,102,129,102)+c(161,102,27,'var(--va-ac)')+arr(195,102,223,102)+c(252,102,20,'var(--va-paper)')+t(65,108,'A',18)+t(252,108,'B',16);
    else if(kind==='logic')s=r(44,47,88,44,'var(--va-tint)',9)+r(169,47,88,44,'var(--va-paper)',9)+line(88,93,149,123)+line(213,93,149,123)+r(114,124,74,40,'var(--va-ac)',8)+t(88,75,'A',18)+t(213,75,'B',18)+t(150,151,'∴',25);
    else if(kind==='thought')s=c(151,83,48,'var(--va-tint)')+p('M124 123L125 153H176V122','fill="var(--va-paper)"')+p('M129 68Q111 49 139 46Q155 25 169 49Q193 44 185 67Q201 84 181 94Q180 113 160 103Q138 118 129 98Q107 88 129 68Z','fill="var(--va-paper)"')+line(153,55,153,100)+c(153,74,6,'var(--va-ac)');
    else {
      // An honest semantic map for words that do not depict a concrete object.
      // Its actual meaning is typeset, rather than an unrelated stock photograph.
      s=c(151,96,57,'var(--va-tint)')+c(151,96,32,'var(--va-paper)')+line(96,75,57,55)+line(204,75,244,55)+line(151,153,151,174)+c(49,49,12,'var(--va-mint)')+c(252,49,12,'var(--va-coral)')+t(151,105,'↔',27);
    }
    if(labels && meaning && !['body','math'].includes(kind)) {
      const short=meaning.split(/[,;]/)[0].replace(/^to /,'');
      if(short.length<=32)s+=t(150,192,short,11);
    }
    return s;
  }
  function draw(e,opts={}) {
    const v=spec(e), alt=opts.hideMeaning?'Merkbild':((e.article?e.article+' ':'')+(e.term||e.w||'')+' · '+(e.en||[]).join(', '));
    return `<svg class="va-art" viewBox="0 0 300 210" role="img" aria-label="${esc(alt)}" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--va-ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${scene(v,e,!opts.hideMeaning)}</g></svg>`;
  }
  const names=['walk','face','speech','crop','body','work','machine','energy','law','democracy','history','math','money'];
  function hero(n){
    const themes=[
      [['Armlehne','armrest','furniture'],['schlendern','stroll','walk'],['Schneebesen','whisk','kitchen']],
      [['Gelassenheit','calm','calm'],['Einfühlungsvermögen','empathy','empathy'],['Frohsinn','joy','joy']],
      [['Gespräch','conversation','speech'],['Verbindung','network','network'],['Lesen','book','book']],
      [['Ackerbau','crop cultivation','crop'],['Weide','cow','animal'],['Ernährung','food','food']],
      [['Körper','human body','body'],['Prävention','prevention','medicine'],['Gewebe','body tissue','body']],
      [['Teamgeist','teamwork','work'],['Vielfalt','diversity','population'],['Beruf','career','work']],
      [['Verfahren','machine','machine'],['Hypothese','hypothesis','thought'],['Beleg','evidence','target']],
      [['Energie','energy','energy'],['Lieferkette','freight','transport'],['Netzwerk','network','network']],
      [['Recht','law','law'],['Schutz','protection','safety'],['Nachweis','evidence','target']],
      [['Demokratie','democracy','democracy'],['Gesellschaft','population','population'],['Rechtsstaat','law','law']],
      [['Geschichte','history','history'],['Gesellschaft','population','population'],['Kultur','book','book']],
      [['Gleichung','equation','math'],['Schlussfolgerung','logic','logic'],['Radius','radius','math']],
      [['Gehalt','salary','money'],['Konjunktur','growth','up'],['Zinsen','interest','money']]
    ];
    const trio=themes[(n-1)%13], positions=[[24,142,-11,.83],[229,70,7,1],[433,152,13,.83]];
    const panels=trio.map(([word,meaning,kind],i)=>{
      const [x,y,angle,scale]=positions[i],e={term:word,en:[meaning],visual:{kind,where:kind==='body'?'chest':undefined}};
      const visual=scene(spec(e),e,false);
      return `<g transform="translate(${x} ${y}) rotate(${angle} 94 120) scale(${scale})">${r(6,11,196,231,'var(--va-ink)',20).replace('fill=','opacity=".055" fill=')}${r(0,0,196,231,'var(--va-paper)',20)}<g transform="translate(2 24) scale(.64)" stroke="var(--va-ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${visual}</g>${line(24,180,172,180,'stroke="var(--va-tint)"')}${t(98,207,word,word.length>18?11:14)}</g>`;
    }).join('');
    return `<svg class="va-art va-hero" viewBox="0 0 640 430" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${c(318,224,173,'var(--va-tint)')}${p('M32 300Q150 391 304 336T607 235','stroke="var(--va-ac)" stroke-opacity=".2" fill="none" stroke-dasharray="3 10" stroke-width="2"')}${c(102,74,7,'var(--va-gold)')}${c(553,330,5,'var(--va-coral)')}${panels}${p('M513 67v18m-9-9h18','fill="none" stroke="var(--va-ac)" stroke-width="2" stroke-linecap="round"')}</svg>`;
  }
  root.C1_ART={draw,spec,hero,kinds:()=>[...new Set(rules.map(x=>x[0]))].concat('meaning')};
  if(typeof module!=='undefined')module.exports=root.C1_ART;
})(typeof window!=='undefined'?window:globalThis);

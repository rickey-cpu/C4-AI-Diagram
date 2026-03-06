// ─────────────────────────────────────────────────────────────
//  THEMES
// ─────────────────────────────────────────────────────────────
const TH={
  dark:      {bg:'#0b0e14',sf:'#111520',sf2:'#161c2d',bd:'#1e2a42',ac:'#3d7eff',ac2:'#00e5c3',tx:'#e2e8f8',mu:'#5a6a8a',di:'#8896b3',gr:'#1e2a42'},
  blueprint: {bg:'#001428',sf:'#002244',sf2:'#003166',bd:'#004a99',ac:'#4da6ff',ac2:'#00d4ff',tx:'#d0eaff',mu:'#3a6a99',di:'#5a8fbf',gr:'#002a55'},
  light:     {bg:'#f8faff',sf:'#ffffff',sf2:'#eef1f8',bd:'#dde3f0',ac:'#2563eb',ac2:'#059669',tx:'#1e293b',mu:'#94a3b8',di:'#64748b',gr:'#e2e8f5'},
  neon:      {bg:'#050508',sf:'#0d0d15',sf2:'#13131f',bd:'#2a0040',ac:'#ff00ff',ac2:'#00ffcc',tx:'#f0e0ff',mu:'#5a2080',di:'#9040c0',gr:'#1a0030'},
  forest:    {bg:'#030e06',sf:'#071209',sf2:'#0d1e10',bd:'#1a3d1f',ac:'#00e676',ac2:'#69f0ae',tx:'#c8e6c9',mu:'#2e7d32',di:'#4caf50',gr:'#112414'},
  warm:      {bg:'#100800',sf:'#1a0f00',sf2:'#231500',bd:'#3d2200',ac:'#ff9500',ac2:'#ffd000',tx:'#fff3e0',mu:'#7a4800',di:'#bf6e00',gr:'#2d1500'},
};
const NС_BASE={
  person:    {fill:'#dbeafe',stroke:'#2563eb',text:'#1e40af'},
  system:    {fill:'#d1fae5',stroke:'#059669',text:'#065f46'},
  container: {fill:'#ede9fe',stroke:'#7c3aed',text:'#4c1d95'},
  component: {fill:'#fef3c7',stroke:'#d97706',text:'#78350f'},
  database:  {fill:'#fee2e2',stroke:'#dc2626',text:'#7f1d1d'},
  external:  {fill:'#f1f5f9',stroke:'#64748b',text:'#334155'},
};
let NC=JSON.parse(JSON.stringify(NС_BASE));
const NSZ={person:{w:112,h:96},system:{w:148,h:82},container:{w:162,h:80},component:{w:152,h:74},database:{w:116,h:90},external:{w:136,h:80}};
const LVN={1:'Level 1: System Context',2:'Level 2: Container',3:'Level 3: Component',4:'Level 4: Code'};

function setTheme(name){
  S.theme=name;
  const T=TH[name]||TH.dark;
  const r=document.documentElement;
  r.style.setProperty('--bg',T.bg);r.style.setProperty('--sf',T.sf);r.style.setProperty('--sf2',T.sf2);
  r.style.setProperty('--bd',T.bd);r.style.setProperty('--ac',T.ac);r.style.setProperty('--ac2',T.ac2);
  r.style.setProperty('--tx',T.tx);r.style.setProperty('--mu',T.mu);r.style.setProperty('--di',T.di);
  document.querySelectorAll('.thsw').forEach(el=>el.classList.remove('on'));
  const el=document.getElementById('th-'+name);if(el)el.classList.add('on');
  const nm={light:{person:{fill:'#dbeafe',stroke:'#2563eb',text:'#1e40af'},system:{fill:'#d1fae5',stroke:'#059669',text:'#065f46'},container:{fill:'#ede9fe',stroke:'#7c3aed',text:'#4c1d95'},component:{fill:'#fef3c7',stroke:'#d97706',text:'#78350f'},database:{fill:'#fee2e2',stroke:'#dc2626',text:'#7f1d1d'},external:{fill:'#f1f5f9',stroke:'#64748b',text:'#334155'}},blueprint:{person:{fill:'#002c5f',stroke:'#4da6ff',text:'#90c8ff'},system:{fill:'#003344',stroke:'#00d4ff',text:'#80eaff'},container:{fill:'#1a0050',stroke:'#9d7aff',text:'#c4b0ff'},component:{fill:'#002244',stroke:'#ffd700',text:'#ffe066'},database:{fill:'#1a0020',stroke:'#ff6090',text:'#ffb0c0'},external:{fill:'#001428',stroke:'#4488aa',text:'#88bbcc'}},neon:{person:{fill:'#1a0030',stroke:'#ff00ff',text:'#ff99ff'},system:{fill:'#002233',stroke:'#00ffcc',text:'#99ffee'},container:{fill:'#0a0040',stroke:'#aa00ff',text:'#cc88ff'},component:{fill:'#201000',stroke:'#ffcc00',text:'#ffe599'},database:{fill:'#200010',stroke:'#ff4488',text:'#ff99bb'},external:{fill:'#101010',stroke:'#606080',text:'#9090b0'}},forest:{person:{fill:'#0a2010',stroke:'#00e676',text:'#80ffc0'},system:{fill:'#082015',stroke:'#69f0ae',text:'#b2ffd6'},container:{fill:'#101a08',stroke:'#c6ef00',text:'#e8ff88'},component:{fill:'#181000',stroke:'#ffab40',text:'#ffd699'},database:{fill:'#0d1a0a',stroke:'#4caf50',text:'#a5d6a7'},external:{fill:'#0a0f08',stroke:'#607d4a',text:'#90a878'}},warm:{person:{fill:'#1f0c00',stroke:'#ff9500',text:'#ffcc80'},system:{fill:'#1a0d00',stroke:'#ffd000',text:'#ffe680'},container:{fill:'#1f1000',stroke:'#ff6600',text:'#ffaa66'},component:{fill:'#150a00',stroke:'#ff3300',text:'#ff9977'},database:{fill:'#100500',stroke:'#cc4400',text:'#ff9966'},external:{fill:'#120c00',stroke:'#886644',text:'#ccaa88'}}};
  NC=nm[name]?JSON.parse(JSON.stringify(nm[name])):JSON.parse(JSON.stringify(NС_BASE));
  buildPalette();draw();
}

function buildPalette(){
  const box=document.getElementById('palette');box.innerHTML='';
  const ic={person:'👤',system:'⬡',container:'▭',component:'◫',database:'🗄',external:'⬡'};
  ['person','system','container','component','database','external'].forEach(t=>{
    const row=document.createElement('div');row.className='palrow';
    row.innerHTML=`<span class="pallbl">${ic[t]} ${t}</span>`;
    const f=document.createElement('input');f.type='color';f.className='pc';f.value=NC[t].fill;f.title='Fill';
    f.oninput=ev=>{NC[t].fill=ev.target.value;draw();};
    const s=document.createElement('input');s.type='color';s.className='pc';s.value=NC[t].stroke;s.title='Border';
    s.oninput=ev=>{NC[t].stroke=ev.target.value;draw();};
    row.appendChild(f);row.appendChild(s);box.appendChild(row);
  });
}

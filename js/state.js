// ─────────────────────────────────────────────────────────────
//  CORE STATE
// ─────────────────────────────────────────────────────────────
/*
  DRAW.IO ORTHOGONAL EDGE MODEL
  ─────────────────────────────
  edge = { id, src, tgt, label, bends:[{x,y},...], color, width, dash }
  
  bends = user-defined intermediate points (NOT including src/tgt ports)
  
  Route: srcPort → [auto L-segments] → bends[0] → ... → bends[N-1] → [auto L-segments] → tgtPort
  
  orthoRoute(sp, bends, tp) → array of {x,y} forming strict H/V polyline
  
  HANDLES (visible on hover, no pre-select needed):
    ■ Segment handles  — center of each segment, colored bar perpendicular to segment
      H-segment → drag moves Y only  (cursor: ns-resize)
      V-segment → drag moves X only  (cursor: ew-resize)
    ● Bend handles  — on each explicit bend point, drag freely (cursor: move)
    ○ Endpoint handles  — on src/tgt ports, drag to reconnect (cursor: crosshair)
  
  SNAP:
    Grid = 10px  (Shift key disables)
    Magnetic = 16px radius around node center+ports
*/
const S = {
    nodes: [], edges: [],
    sel: null, selType: null,
    conn: null,
    drag: null,
    hover: null,
    pan: { x: 50, y: 50 }, panStart: null,
    zoom: 1, tool: 'select', level: 1,
    apiKey: localStorage.getItem('c4key') || '',
    nid: 1, theme: 'light',
    mx: 0, my: 0,
    snapOn: true,
    dirty: false,     // RAF dirty flag
};
const SNAP = 10, MAGNET = 16;
let dropType = null;
let _rafId = null;

const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
const wrap = document.getElementById('cvswrap');

// draw() now just sets dirty flag; actual render happens in RAF loop
function draw() { if (!_rafId) { _rafId = requestAnimationFrame(() => { _rafId = null; _render(); }); } }
function resize() { cvs.width = wrap.clientWidth; cvs.height = wrap.clientHeight; _render(); }
window.addEventListener('resize', resize);

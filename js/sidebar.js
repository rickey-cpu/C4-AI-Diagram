// ─────────────────────────────────────────────────────────────
//  SIDEBAR DRAG DROP & PROPERTIES
// ─────────────────────────────────────────────────────────────
function ds(e) { dropType = e.currentTarget.dataset.type; e.dataTransfer.setData('text/plain', dropType); }
wrap.addEventListener('dragover', e => e.preventDefault());
wrap.addEventListener('drop', e => {
    e.preventDefault(); if (!dropType) return;
    const { x, y } = toW(e.clientX, e.clientY);
    const sz = NSZ[dropType] || { w: 135, h: 78 };
    const n = { id: 'n' + (S.nid++), type: dropType, label: cap(dropType), desc: '', x: x - sz.w / 2, y: y - sz.h / 2, w: sz.w, h: sz.h };
    S.nodes.push(n); S.sel = n.id; S.selType = 'node'; showNodeProps(n); draw(); upd(); dropType = null;
});

// ─────────────────────────────────────────────────────────────
//  PROPERTIES
// ─────────────────────────────────────────────────────────────
function showNodeProps(n) {
    document.getElementById('propbox').innerHTML = `
  <div class="pr"><span class="pl">Label</span><input class="pi" value="${xe(n.label)}" oninput="selN().label=this.value;draw()"></div>
  <div class="pr"><span class="pl">Desc</span><input class="pi" value="${xe(n.desc || '')}" oninput="selN().desc=this.value;draw()"></div>
  <div class="pr"><span class="pl">Type</span>
    <select class="pi" onchange="selN().type=this.value;draw()">
      ${['person', 'system', 'container', 'component', 'database', 'external'].map(t => `<option ${n.type === t ? 'selected' : ''}>${t}</option>`).join('')}
    </select></div>
  <div class="pr"><span class="pl">Fill</span><input type="color" class="pc" value="${n.cFill || NC[n.type].fill}" oninput="selN().cFill=this.value;draw()"></div>
  <div class="pr"><span class="pl">Border</span><input type="color" class="pc" value="${n.cStroke || NC[n.type].stroke}" oninput="selN().cStroke=this.value;draw()"></div>
  <div class="pr"><button class="hbtn" style="font-size:10px;padding:3px 8px" onclick="selN().cFill=null;selN().cStroke=null;draw()">↺ Reset</button></div>`;
}
function showEdgeProps(e) {
    const dc = JSON.stringify(e.dash || [6, 3]);
    document.getElementById('propbox').innerHTML = `
  <div style="font-size:9px;color:var(--mu);margin-bottom:6px">EDGE · <b>${(e.bends || []).length}</b> điểm uốn<br><span style="opacity:.65">Kéo segment để dịch · Kéo ● bend để di chuyển · Dbl-click ● xóa</span></div>
  <div class="pr"><span class="pl">Label</span><input class="pi" value="${xe(e.label || '')}" oninput="selE().label=this.value;draw()"></div>
  <div class="pr"><span class="pl">Color</span><input type="color" class="pc" value="${e.color || '#3d7eff'}" oninput="selE().color=this.value;draw()"></div>
  <div class="pr"><span class="pl">Width</span><input type="range" min="1" max="8" step=".5" value="${e.width || 1.5}" style="flex:1" oninput="selE().width=+this.value;draw()"></div>
  <div class="pr"><span class="pl">Style</span>
    <select class="pi" onchange="setDash(this.value)">
      <option value="solid"    ${dc === '[1,0]' ? 'selected' : ''}>─── Solid</option>
      <option value="dash"     ${dc === '[6,3]' ? 'selected' : ''}>─ ─ Dashed</option>
      <option value="dot"      ${dc === '[2,4]' ? 'selected' : ''}>··· Dotted</option>
      <option value="longdash" ${dc === '[12,4]' ? 'selected' : ''}>——— Long dash</option>
    </select></div>
  <div class="pr">
    <button class="hbtn" style="font-size:10px;padding:3px 8px" onclick="selE().bends=[];showEdgeProps(selE());draw()">↺ Reset</button>
  </div>`;
}
function selN() { return S.nodes.find(n => n.id === S.sel); }
function selE() { return S.edges.find(e => e.id === S.sel); }
function setDash(v) { const e = selE(); if (e) { e.dash = { solid: [1, 0], dash: [6, 3], dot: [2, 4], longdash: [12, 4] }[v] || [6, 3]; draw(); } }
function xe(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

// ─────────────────────────────────────────────────────────────
//  TOOLS & CONTROLS
// ─────────────────────────────────────────────────────────────
function setTool(t) {
    S.tool = t; S.conn = null;
    ['select', 'connect', 'pan'].forEach(k => document.getElementById('tool-' + k).classList.toggle('on', k === t));
    cvs.style.cursor = t === 'pan' ? 'grab' : 'default';
}
function setLv(lv) { S.level = lv; document.querySelectorAll('.lvl').forEach(el => el.classList.toggle('on', parseInt(el.dataset.lv) === lv)); document.getElementById('slvl').textContent = LVN[lv]; }
function clearAll() { if (!confirm('Clear all?')) return; S.nodes = []; S.edges = []; S.sel = null; S.selType = null; document.getElementById('propbox').innerHTML = 'Select element'; draw(); upd(); }
function fitView() {
    if (!S.nodes.length) return;
    const xs = S.nodes.map(n => n.x), ys = S.nodes.map(n => n.y), xe = S.nodes.map(n => n.x + n.w), ye = S.nodes.map(n => n.y + n.h);
    const mnx = Math.min(...xs) - 40, mny = Math.min(...ys) - 40, mxx = Math.max(...xe) + 40, mxy = Math.max(...ye) + 40;
    S.zoom = Math.min(cvs.width / (mxx - mnx), cvs.height / (mxy - mny), 2.5);
    S.pan.x = -mnx * S.zoom + (cvs.width - (mxx - mnx) * S.zoom) / 2;
    S.pan.y = -mny * S.zoom + (cvs.height - (mxy - mny) * S.zoom) / 2;
    document.getElementById('szoom').textContent = Math.round(S.zoom * 100) + '%'; draw();
}
function autoLayout() {
    if (!S.nodes.length) return;
    const cols = Math.ceil(Math.sqrt(S.nodes.length));
    S.nodes.forEach((n, i) => { n.x = 60 + (i % cols) * 200; n.y = 60 + Math.floor(i / cols) * 170; });
    S.edges.forEach(e => { e.bends = []; });
    draw(); setTimeout(fitView, 50);
}
function exportSVG() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" style="background:${TH[S.theme].bg}">`;
    S.edges.forEach(e => {
        const path = fullPath(e); if (path.length < 2) return;
        const d = 'M' + path.map(p => p.x + ',' + p.y).join('L');
        const col = e.color || TH[S.theme].ac;
        svg += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${e.width || 1.5}" stroke-dasharray="${(e.dash || [6, 3]).join(',')}"/>`;
        if (e.label) { const mi = Math.floor(path.length / 2); svg += `<text x="${(path[mi - 1].x + path[mi].x) / 2}" y="${(path[mi - 1].y + path[mi].y) / 2 - 5}" fill="${TH[S.theme].di}" font-size="9" text-anchor="middle">${xe(e.label)}</text>`; }
    });
    S.nodes.forEach(n => { const c = NC[n.type] || NC.system; const fill = n.cFill || c.fill, stroke = n.cStroke || c.stroke; svg += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${n.x + n.w / 2}" y="${n.y + 13}" fill="${stroke}" font-size="8" text-anchor="middle" font-family="monospace">[${n.type.toUpperCase()}]</text><text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 5}" fill="${TH[S.theme].tx}" font-size="12" font-weight="bold" text-anchor="middle" font-family="sans-serif">${xe(n.label)}</text>`; if (n.desc) svg += `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 17}" fill="${c.text}" font-size="9" text-anchor="middle">${xe(n.desc)}</text>`; });
    svg += '</svg>';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); a.download = 'c4-level' + S.level + '.svg'; a.click();
}
function upd() { document.getElementById('ncnt').textContent = S.nodes.length + ' nodes, ' + S.edges.length + ' edges'; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

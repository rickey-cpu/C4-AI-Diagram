// ─────────────────────────────────────────────────────────────
//  DRAW NODE
// ─────────────────────────────────────────────────────────────
function drawNode(n) {
    const T = TH[S.theme] || TH.dark;
    const c = NC[n.type] || NC.system;
    const fill = n.cFill || c.fill, stroke = n.cStroke || c.stroke;
    const sel = S.sel === n.id && S.selType === 'node';
    const isDragging = S.drag?.kind === 'node' && S.drag.node === n;
    ctx.save();
    // While dragging: render slightly transparent so user sees drop position clearly
    if (isDragging) ctx.globalAlpha = 0.82;
    if (sel && !isDragging) { ctx.shadowColor = stroke + '88'; ctx.shadowBlur = 12 / S.zoom; }
    if (n.type === 'person') drawPerson(n, fill, stroke, sel);
    else if (n.type === 'database') drawDb(n, fill, stroke, sel);
    else {
        rrect(n.x, n.y, n.w, n.h, 8);
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = sel ? '#fff' : stroke; ctx.lineWidth = (sel ? 2.5 : 1.5) / S.zoom; ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.font = `${8 / S.zoom}px DM Mono,monospace`; ctx.fillStyle = stroke; ctx.textAlign = 'center';
    ctx.fillText('[' + n.type.toUpperCase() + ']', n.x + n.w / 2, n.y + 13 / S.zoom);
    ctx.fillStyle = T.tx; ctx.font = `bold ${12 / S.zoom}px DM Sans,sans-serif`; ctx.textAlign = 'center';
    const by = n.type === 'person' ? n.y + n.h * .58 : n.y + n.h / 2 + (n.desc ? -5 / S.zoom : 4 / S.zoom);
    wtxt(n.label, n.x + n.w / 2, by, n.w - 14, 14 / S.zoom);
    if (n.desc) { ctx.fillStyle = c.text; ctx.font = `${9 / S.zoom}px DM Mono,monospace`; wtxt(n.desc, n.x + n.w / 2, by + 15 / S.zoom, n.w - 12, 11 / S.zoom); }
    ctx.restore();
}
function drawPerson(n, fill, stroke, sel) {
    const cx = n.x + n.w / 2, cy = n.y + 20, r = 16;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = sel ? '#fff' : stroke; ctx.lineWidth = (sel ? 2.5 : 1.5) / S.zoom; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 22, n.y + n.h - 8); ctx.quadraticCurveTo(cx, n.y + 46, cx + 22, n.y + n.h - 8); ctx.stroke();
}
function drawDb(n, fill, stroke, sel) {
    const { x, y, w, h } = n, ry = 11;
    ctx.beginPath();
    ctx.moveTo(x, y + ry); ctx.lineTo(x, y + h - ry);
    ctx.quadraticCurveTo(x, y + h, x + w / 2, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - ry);
    ctx.lineTo(x + w, y + ry);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = sel ? '#fff' : stroke; ctx.lineWidth = (sel ? 2.5 : 1.5) / S.zoom; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function wtxt(text, x, y, maxW, lh) {
    if (!text) return;
    const ws = String(text).split(' '); let ln = '';
    for (const w of ws) {
        const t = ln ? ln + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && ln) { ctx.fillText(ln, x, y); ln = w; y += lh; } else ln = t;
    }
    ctx.fillText(ln, x, y);
}

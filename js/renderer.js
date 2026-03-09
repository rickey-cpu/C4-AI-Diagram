// ─────────────────────────────────────────────────────────────
//  DRAW (main render loop)
// ─────────────────────────────────────────────────────────────
function _render() {
    const T = TH[S.theme] || TH.dark;
    const w = cvs.cssWidth || cvs.width;
    const h = cvs.cssHeight || cvs.height;

    // Clear rect uses logical coordinates because ctx is already scaled by DPR
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, w, h);

    // Grid
    const gs = SNAP * S.zoom;
    const ox = ((S.pan.x % (gs * 3)) + gs * 3) % (gs * 3), oy = ((S.pan.y % (gs * 3)) + gs * 3) % (gs * 3);
    ctx.save();
    ctx.strokeStyle = T.gr; ctx.lineWidth = .5; ctx.globalAlpha = .22;
    for (let x = ox - gs * 3; x < w + gs * 3; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = oy - gs * 3; y < h + gs * 3; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();

    ctx.save();
    ctx.translate(S.pan.x, S.pan.y);
    ctx.scale(S.zoom, S.zoom);

    // Edges (all, with hover-aware handles)
    S.edges.forEach(e => drawEdge(e));

    // Connect preview
    if ((S.tool === 'connect' || S.drag?.kind === 'conn') && S.conn) {
        const src = S.nodes.find(n => n.id === S.conn);
        if (src) {
            const p = getPort(src, S.mx, S.my);
            ctx.save();
            ctx.strokeStyle = T.ac; ctx.lineWidth = 2 / S.zoom;
            ctx.setLineDash([5 / S.zoom, 4 / S.zoom]);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(S.mx, S.my); ctx.stroke();
            const ang = Math.atan2(S.my - p.y, S.mx - p.x), as = 9 / S.zoom;
            ctx.fillStyle = T.ac; ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(S.mx, S.my);
            ctx.lineTo(S.mx - as * Math.cos(ang - .42), S.my - as * Math.sin(ang - .42));
            ctx.lineTo(S.mx - as * Math.cos(ang + .42), S.my - as * Math.sin(ang + .42));
            ctx.closePath(); ctx.fill();
            const tn = hitNode(S.mx, S.my);
            if (tn && tn.id !== S.conn) {
                const tc = NC[tn.type] || NC.system;
                ctx.strokeStyle = tn.cStroke || tc.stroke; ctx.lineWidth = 3 / S.zoom; ctx.setLineDash([]);
                rrect(tn.x - 4 / S.zoom, tn.y - 4 / S.zoom, tn.w + 8 / S.zoom, tn.h + 8 / S.zoom, 10 / S.zoom); ctx.stroke();
            }
            ctx.restore();
        }
    }

    // Nodes
    S.nodes.forEach(n => drawNode(n));

    // Hover affordances (port dots, segment ghosting, etc.)
    if (!S.drag && !S.panStart) drawHoverAffordances();

    ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  DRAW EDGE  — draw.io style with segment handles always visible on hover
// ─────────────────────────────────────────────────────────────
function drawEdge(e) {
    const T = TH[S.theme] || TH.dark;
    const sel = (S.sel === e.id && S.selType === 'edge');
    const hov = (S.hover?.kind === 'edge' && S.hover.edge === e) || (S.hover?.kind === 'seg' && S.hover.edge === e) || (S.hover?.kind === 'bend' && S.hover.edge === e);
    const path = fullPath(e);
    if (path.length < 2) return;
    const col = e.color || T.ac;

    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // Wide invisible hit zone (drawn first, transparent)
    ctx.strokeStyle = 'rgba(0,0,0,0)';
    ctx.lineWidth = 16 / S.zoom;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();

    // Selection / hover halo
    if (sel || hov) {
        ctx.strokeStyle = col + (sel ? '30' : '18');
        ctx.lineWidth = (sel ? 14 : 10) / S.zoom;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
        path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    }

    // Main line
    ctx.strokeStyle = sel ? col : hov ? col + 'ee' : col + 'aa';
    ctx.lineWidth = (sel ? 2.5 : hov ? 2 : e.width || 1.5) / S.zoom;
    ctx.setLineDash((e.dash || [6, 3]).map(d => d / S.zoom));
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead
    const tip = path[path.length - 1], prv = path[path.length - 2];
    const ang = Math.atan2(tip.y - prv.y, tip.x - prv.x), as = 11 / S.zoom;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - as * Math.cos(ang - .42), tip.y - as * Math.sin(ang - .42));
    ctx.lineTo(tip.x - as * Math.cos(ang + .42), tip.y - as * Math.sin(ang + .42));
    ctx.closePath(); ctx.fill();

    // Label
    if (e.label) {
        const mi = Math.floor(path.length / 2);
        const lx = (path[mi - 1].x + path[mi].x) / 2, ly = (path[mi - 1].y + path[mi].y) / 2 - 8 / S.zoom;
        const fs = 9 / S.zoom;
        ctx.font = `${fs}px DM Mono,monospace`;
        const tw = ctx.measureText(e.label).width + 10 / S.zoom, th = fs * 1.8;
        ctx.fillStyle = T.bg + 'ee'; rrect(lx - tw / 2, ly - th * .85, tw, th, 3 / S.zoom); ctx.fill();
        ctx.fillStyle = T.di; ctx.textAlign = 'center';
        ctx.fillText(e.label, lx, ly);
    }

    // ── DRAW HANDLES (always shown on hover OR selected) ──
    if (sel || hov) drawEdgeHandles(e, sel, path, col, T);

    ctx.restore();
}

// ─────────────────────────────────────────────────────────────
//  EDGE HANDLES  — draw.io style: segment bars + bend dots + endpoints
// ─────────────────────────────────────────────────────────────
function drawEdgeHandles(e, sel, path, col, T) {
    const segs = edgeSegments(e);
    const hovSeg = S.hover?.kind === 'seg' && S.hover.edge === e ? S.hover.segI : -1;
    const dragSeg = S.drag?.kind === 'seg' && S.drag.edge === e ? S.drag.segI : -1;
    const activeSegI = dragSeg >= 0 ? dragSeg : hovSeg;

    // ── Segment handles (draw.io style: thin bars at segment midpoint) ──
    segs.forEach(seg => {
        const len = ptDist(seg.ax, seg.ay, seg.bx, seg.by);
        if (len < 28 / S.zoom) return;
        const active = (seg.segI === activeSegI);
        const mx = seg.midX, my = seg.midY;
        const bw = active ? 12 : 8, bh = active ? 5 : 3.5; // bar dimensions / zoom
        const W = bw / S.zoom, H = bh / S.zoom;

        ctx.save();
        // Translate to midpoint, rotate for segment direction
        ctx.translate(mx, my);
        if (!seg.isH) ctx.rotate(Math.PI / 2); // vertical segment → rotate bar

        // Bar background
        ctx.fillStyle = active ? col : '#ffffff';
        ctx.strokeStyle = active ? col + 'cc' : col + '88';
        ctx.lineWidth = 1.5 / S.zoom;
        ctx.fillRect(-W / 2, -H / 2, W, H);
        ctx.strokeRect(-W / 2, -H / 2, W, H);

        // Arrow indicators (↕ for H-segments, ↔ for V-segments)
        ctx.fillStyle = active ? '#fff' : col;
        const arSz = 2.5 / S.zoom;
        // left arrow
        ctx.beginPath();
        ctx.moveTo(-W / 2 + arSz * 2, 0); ctx.lineTo(-W / 2 + arSz * 2 + arSz, -arSz); ctx.lineTo(-W / 2 + arSz * 2 + arSz, arSz);
        ctx.closePath(); ctx.fill();
        // right arrow
        ctx.beginPath();
        ctx.moveTo(W / 2 - arSz * 2, 0); ctx.lineTo(W / 2 - arSz * 2 - arSz, -arSz); ctx.lineTo(W / 2 - arSz * 2 - arSz, arSz);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    });

    // ── Bend point handles (draw.io: filled circles on explicit bends) ──
    (e.bends || []).forEach((b, i) => {
        const hovBend = S.hover?.kind === 'bend' && S.hover.edge === e && S.hover.idx === i;
        const dragBend = S.drag?.kind === 'bend' && S.drag.edge === e && S.drag.idx === i;
        const active = hovBend || dragBend;
        const R = active ? 7 : 5;
        ctx.beginPath(); ctx.arc(b.x, b.y, R / S.zoom, 0, Math.PI * 2);
        ctx.fillStyle = active ? col : '#ffffff';
        ctx.strokeStyle = col; ctx.lineWidth = 2 / S.zoom;
        ctx.fill(); ctx.stroke();
    });

    // ── Endpoint handles (src and tgt) — shown when selected ──
    if (sel && path.length >= 2) {
        [path[0], path[path.length - 1]].forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 6 / S.zoom, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = col; ctx.lineWidth = 2 / S.zoom;
            ctx.fill(); ctx.stroke();
        });
    }
}

// ─────────────────────────────────────────────────────────────
//  HOVER AFFORDANCES  (nodes + port dots)
// ─────────────────────────────────────────────────────────────
function drawHoverAffordances() {
    const T = TH[S.theme] || TH.dark;
    const h = S.hover;
    if (!h) return;
    ctx.save();

    if (h.kind === 'node') {
        const n = h.node;
        const c = NC[n.type] || NC.system;
        const stroke = n.cStroke || c.stroke;
        // Hover ring
        ctx.strokeStyle = stroke + '55'; ctx.lineWidth = 3 / S.zoom; ctx.setLineDash([]);
        if (n.type === 'person') {
            ctx.beginPath(); ctx.arc(n.x + n.w / 2, n.y + 20, 21, 0, Math.PI * 2); ctx.stroke();
        } else {
            rrect(n.x - 3 / S.zoom, n.y - 3 / S.zoom, n.w + 6 / S.zoom, n.h + 6 / S.zoom, 10 / S.zoom); ctx.stroke();
        }
        // Port dots on all 4 sides
        [{ x: n.x + n.w / 2, y: n.y }, { x: n.x + n.w / 2, y: n.y + n.h }, { x: n.x, y: n.y + n.h / 2 }, { x: n.x + n.w, y: n.y + n.h / 2 }]
            .forEach(p => {
                ctx.beginPath(); ctx.arc(p.x, p.y, 5 / S.zoom, 0, Math.PI * 2);
                ctx.fillStyle = stroke + 'cc'; ctx.fill();
                ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1.5 / S.zoom; ctx.stroke();
            });

    } else if (h.kind === 'port') {
        const n = h.node;
        const c = NC[n.type] || NC.system;
        const stroke = n.cStroke || c.stroke;
        const pm = {
            top: { x: n.x + n.w / 2, y: n.y }, bottom: { x: n.x + n.w / 2, y: n.y + n.h },
            left: { x: n.x, y: n.y + n.h / 2 }, right: { x: n.x + n.w, y: n.y + n.h / 2 }
        };
        const p = pm[h.side];
        ctx.beginPath(); ctx.arc(p.x, p.y, 9 / S.zoom, 0, Math.PI * 2);
        ctx.fillStyle = stroke + '33'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 / S.zoom, 0, Math.PI * 2);
        ctx.fillStyle = stroke; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / S.zoom; ctx.stroke();
    }

    ctx.restore();
}

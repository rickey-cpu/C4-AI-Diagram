// ─────────────────────────────────────────────────────────────
//  MOUSE EVENTS
// ─────────────────────────────────────────────────────────────
cvs.addEventListener('mousedown', evt => {
    if (evt.button !== 0) return;
    const { x, y } = toW(evt.clientX, evt.clientY);

    // PAN tool
    if (S.tool === 'pan') {
        S.panStart = { mx: evt.clientX, my: evt.clientY, px: S.pan.x, py: S.pan.y };
        cvs.style.cursor = 'grabbing'; return;
    }

    // CONNECT tool (click-click mode)
    if (S.tool === 'connect') {
        const h = hitNode(x, y);
        if (h) {
            if (!S.conn) S.conn = h.id;
            else if (S.conn !== h.id) {
                const e = { id: 'e' + (S.nid++), src: S.conn, tgt: h.id, label: '', bends: [], color: null, width: 1.5, dash: [6, 3] };
                S.edges.push(e); S.sel = e.id; S.selType = 'edge'; showEdgeProps(e);
                S.conn = null; upd(); draw();
            }
        } else S.conn = null;
        return;
    }

    // ── SELECT TOOL — priority order ──

    // 1. Endpoint handle of selected edge (reconnect)
    if (S.selType === 'edge') {
        const se = S.edges.find(e => e.id === S.sel);
        const ep = hitEndpointHandle(x, y, se);
        if (ep) {
            S.drag = { kind: 'endpoint', edge: se, which: ep };
            cvs.style.cursor = 'crosshair'; draw(); return;
        }
        // 2. Bend handle of selected edge
        const bi = hitBendHandle(x, y, se);
        if (bi >= 0) {
            S.drag = { kind: 'bend', edge: se, idx: bi };
            cvs.style.cursor = 'move'; return;
        }
    }

    // 3. Segment handle (ANY edge, no pre-select needed — draw.io behavior)
    const sh = hitSegHandle(x, y);
    if (sh) {
        if (S.sel !== sh.edge.id) { S.sel = sh.edge.id; S.selType = 'edge'; showEdgeProps(sh.edge); }
        // Snapshot original bends at drag start — absolute offset applied each frame
        const e = sh.edge;
        const origBends = (e.bends || []).map(b => ({ ...b }));
        const path = fullPath(e);
        // Which path-point Y (H) or X (V) is the segment locked to?
        const segY = sh.isH ? (path[sh.segI].y + path[sh.segI + 1].y) / 2 : null;
        const segX = !sh.isH ? (path[sh.segI].x + path[sh.segI + 1].x) / 2 : null;
        S.drag = {
            kind: 'seg', edge: e, segI: sh.segI, isH: sh.isH,
            origBends, segY, segX,
            startX: x, startY: y,
            // insert bends upfront if none — so we always have something to move
            needsInit: origBends.length === 0
        };
        if (S.drag.needsInit) initSegBends(e, sh.segI, sh.isH, path);
        // Re-snapshot after init — lock to the actual bend Y/X, not path segment
        S.drag.origBends = (e.bends || []).map(b => ({ ...b }));
        // segY/segX = the value we'll move (use first bend's coord after init)
        if (sh.isH) {
            S.drag.segY = e.bends.length ? e.bends[0].y : y;
        } else {
            S.drag.segX = e.bends.length ? e.bends[0].x : x;
        }
        cvs.style.cursor = sh.isH ? 'ns-resize' : 'ew-resize';
        draw(); return;
    }

    // 4. Node port → drag-connect
    const hp = hitNodePort(x, y);
    if (hp) {
        S.conn = hp.node.id;
        S.drag = { kind: 'conn', srcNode: hp.node };
        cvs.style.cursor = 'crosshair'; draw(); return;
    }

    // 5. Node interior → move
    const hn = hitNode(x, y);
    if (hn) {
        S.sel = hn.id; S.selType = 'node';
        S.drag = { kind: 'node', node: hn, ox: x - hn.x, oy: y - hn.y };
        showNodeProps(hn); draw(); return;
    }

    // 6. Edge body → select
    const he = hitAnyEdge(x, y);
    if (he) {
        S.sel = he.id; S.selType = 'edge';
        showEdgeProps(he); draw(); return;
    }

    // 7. Background → pan/deselect
    S.sel = null; S.selType = null; S.drag = null;
    document.getElementById('propbox').innerHTML = 'Select element';
    S.panStart = { mx: evt.clientX, my: evt.clientY, px: S.pan.x, py: S.pan.y };
    draw();
});

cvs.addEventListener('mousemove', evt => {
    const { x, y } = toW(evt.clientX, evt.clientY);
    S.mx = x; S.my = y;

    // Pan
    if (S.panStart) {
        S.pan.x = S.panStart.px + (evt.clientX - S.panStart.mx);
        S.pan.y = S.panStart.py + (evt.clientY - S.panStart.my);
        draw(); return;
    }

    // Active drag — all logic uses absolute mouse position for smoothness
    if (S.drag) {
        if (S.drag.kind === 'node') {
            // No snap during drag — apply snap only on mouse-up for fluid feel
            // (draw.io snaps only to grid, not on every pixel)
            const n = S.drag.node;
            n.x = x - S.drag.ox; n.y = y - S.drag.oy;  // raw tracking, snap on release

        } else if (S.drag.kind === 'seg') {
            // Absolute offset from start position applied to original bends
            const e = S.drag.edge;
            const rawDy = y - S.drag.startY;
            const rawDx = x - S.drag.startX;
            if (S.drag.isH) {
                const newY = snap(S.drag.segY + rawDy);
                applySegOffset(e, S.drag.origBends, S.drag.segY, null, newY, null);
            } else {
                const newX = snap(S.drag.segX + rawDx);
                applySegOffset(e, S.drag.origBends, null, S.drag.segX, null, newX);
            }

        } else if (S.drag.kind === 'bend') {
            // Smooth bend drag — no cleanBends during drag (only on release)
            const sp = evt.shiftKey ? { x, y } : { x: snap(x), y: snap(y) };
            S.drag.edge.bends[S.drag.idx] = { x: sp.x, y: sp.y };

        } else if (S.drag.kind === 'endpoint') {
            // visual preview via S.mx/S.my
        } else if (S.drag.kind === 'conn') {
            // live preview via S.mx/S.my
        }
        draw(); return;
    }

    if (S.tool === 'connect' && S.conn) { draw(); return; }

    // ── Hover detection (only when not dragging) ──
    updateHover(x, y, evt);
    draw();
});

cvs.addEventListener('mouseup', evt => {
    if (S.drag?.kind === 'node') {
        // Snap to grid on release (draw.io style)
        const n = S.drag.node;
        n.x = snap(n.x); n.y = snap(n.y);
    }
    if (S.drag?.kind === 'seg') {
        // Clean up collinear bends only on release, not during drag
        cleanBends(S.drag.edge);
        showEdgeProps(S.drag.edge);
    }
    if (S.drag?.kind === 'bend') {
        cleanBends(S.drag.edge);
        showEdgeProps(S.drag.edge);
    }
    if (S.drag?.kind === 'endpoint') {
        const { x, y } = toW(evt.clientX, evt.clientY);
        const tgt = hitNode(x, y);
        if (tgt) {
            const e = S.drag.edge;
            if (S.drag.which === 'src') e.src = tgt.id;
            else e.tgt = tgt.id;
            e.bends = [];
            showEdgeProps(e);
        }
    }
    if (S.drag?.kind === 'conn') {
        const { x, y } = toW(evt.clientX, evt.clientY);
        const tgt = hitNode(x, y);
        if (tgt && tgt.id !== S.drag.srcNode.id) {
            const e = { id: 'e' + (S.nid++), src: S.drag.srcNode.id, tgt: tgt.id, label: '', bends: [], color: null, width: 1.5, dash: [6, 3] };
            S.edges.push(e);
            S.sel = e.id; S.selType = 'edge';
            showEdgeProps(e);
            upd();
        }
        S.conn = null;
    }
    S.drag = null; S.panStart = null;
    // Restore cursor based on what's under mouse now
    cvs.style.cursor = S.tool === 'pan' ? 'grab' : 'default';
    draw();
});

cvs.addEventListener('mouseleave', () => {
    S.hover = null;
    document.getElementById('tip').style.display = 'none';
    setHint('↖ Di chuột lên thành phần để xem hành động  ·  Kéo viền node để kết nối  ·  Kéo segment line để uốn');
    draw();
});

cvs.addEventListener('dblclick', evt => {
    const { x, y } = toW(evt.clientX, evt.clientY);
    // Dbl-click bend → delete it
    if (S.selType === 'edge') {
        const e = S.edges.find(e => e.id === S.sel);
        const bi = hitBendHandle(x, y, e);
        if (bi >= 0) { e.bends.splice(bi, 1); showEdgeProps(e); draw(); return; }
    }
    const hn = hitNode(x, y);
    if (hn) { const l = prompt('Edit label:', hn.label); if (l !== null) { hn.label = l; draw(); } return; }
    const he = hitAnyEdge(x, y);
    if (he) { const l = prompt('Edit edge label:', he.label || ''); if (l !== null) { he.label = l; draw(); } }
});

cvs.addEventListener('wheel', evt => {
    evt.preventDefault();
    const { x, y } = toW(evt.clientX, evt.clientY);
    const oz = S.zoom;
    S.zoom = Math.max(.15, Math.min(5, S.zoom * (evt.deltaY > 0 ? .9 : 1.11)));
    S.pan.x = evt.clientX - (x * S.zoom + (S.pan.x - x * oz));
    S.pan.y = evt.clientY - (y * S.zoom + (S.pan.y - y * oz));
    document.getElementById('szoom').textContent = Math.round(S.zoom * 100) + '%';
    draw();
}, { passive: false });

cvs.addEventListener('contextmenu', evt => {
    evt.preventDefault();
    const { x, y } = toW(evt.clientX, evt.clientY);
    const hn = hitNode(x, y);
    if (hn && confirm('Delete "' + hn.label + '"?')) {
        S.nodes = S.nodes.filter(n => n.id !== hn.id);
        S.edges = S.edges.filter(e => e.src !== hn.id && e.tgt !== hn.id);
        if (S.sel === hn.id) { S.sel = null; S.selType = null; }
        draw(); upd(); return;
    }
    const he = hitAnyEdge(x, y);
    if (he && confirm('Delete edge "' + (he.label || '→') + '"?')) {
        S.edges = S.edges.filter(e => e.id !== he.id);
        if (S.sel === he.id) { S.sel = null; S.selType = null; }
        draw(); upd();
    }
});

document.addEventListener('keydown', evt => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (evt.key === 'v' || evt.key === 'V') setTool('select');
    if (evt.key === 'c' || evt.key === 'C') setTool('connect');
    if (evt.key === ' ') { evt.preventDefault(); setTool('pan'); }
    if (evt.key === 'Escape') { S.conn = null; draw(); }
    if ((evt.key === 'Delete' || evt.key === 'Backspace') && S.sel) {
        if (S.selType === 'node') {
            S.nodes = S.nodes.filter(n => n.id !== S.sel);
            S.edges = S.edges.filter(e => e.src !== S.sel && e.tgt !== S.sel);
        } else S.edges = S.edges.filter(e => e.id !== S.sel);
        S.sel = null; S.selType = null;
        document.getElementById('propbox').innerHTML = 'Select element';
        draw(); upd();
    }
});

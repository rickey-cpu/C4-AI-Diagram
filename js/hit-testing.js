// ─────────────────────────────────────────────────────────────
//  HIT TESTING
// ─────────────────────────────────────────────────────────────
function toW(ex, ey) {
    const r = cvs.getBoundingClientRect();
    return { x: (ex - r.left - S.pan.x) / S.zoom, y: (ey - r.top - S.pan.y) / S.zoom };
}
function ptDist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    if (l2 < .001) return ptDist(px, py, ax, ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return ptDist(px, py, ax + t * dx, ay + t * dy);
}
function hitNode(wx, wy) {
    for (let i = S.nodes.length - 1; i >= 0; i--) {
        const n = S.nodes[i];
        if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
    }
    return null;
}
function hitNodePort(wx, wy) {
    const BZ = 14 / S.zoom;
    for (let i = S.nodes.length - 1; i >= 0; i--) {
        const n = S.nodes[i];
        if (wx < n.x - 2 || wx > n.x + n.w + 2 || wy < n.y - 2 || wy > n.y + n.h + 2) continue;
        if (wx > n.x + BZ && wx < n.x + n.w - BZ && wy > n.y + BZ && wy < n.y + n.h - BZ) continue;
        const dl = wx - n.x, dr = n.x + n.w - wx, dt = wy - n.y, db = n.y + n.h - wy;
        const m = Math.min(dl, dr, dt, db);
        return { node: n, side: m === dl ? 'left' : m === dr ? 'right' : m === dt ? 'top' : 'bottom' };
    }
    return null;
}

// Returns edge segments as [{ax,ay,bx,by,isH,midX,midY}, ...]
function edgeSegments(e) {
    const path = fullPath(e);
    const segs = [];
    for (let i = 0; i < path.length - 1; i++) {
        const ax = path[i].x, ay = path[i].y, bx = path[i + 1].x, by = path[i + 1].y;
        const isH = Math.abs(by - ay) < Math.abs(bx - ax);
        segs.push({ ax, ay, bx, by, isH, midX: (ax + bx) / 2, midY: (ay + by) / 2, segI: i });
    }
    return segs;
}

// Hit test for edge segment handle (draw.io style: hit the segment, not just midpoint)
// Returns {edge, segI, isH, midX, midY} or null
function hitSegHandle(wx, wy) {
    const T = Math.max(6, 8 / S.zoom);  // min 6px regardless of zoom
    // Check hovered edge first (priority), then all edges
    const candidates = [...S.edges].reverse();
    for (const e of candidates) {
        const segs = edgeSegments(e);
        for (const seg of segs) {
            const len = ptDist(seg.ax, seg.ay, seg.bx, seg.by);
            if (len < 20 / S.zoom) continue; // too short to handle
            const d = segDist(wx, wy, seg.ax, seg.ay, seg.bx, seg.by);
            if (d < T) return {
                edge: e, segI: seg.segI, isH: seg.isH, midX: seg.midX, midY: seg.midY,
                ax: seg.ax, ay: seg.ay, bx: seg.bx, by: seg.by
            };
        }
    }
    return null;
}

// Hit test for bend handle (explicit bend point on selected edge)
function hitBendHandle(wx, wy, e) {
    if (!e) return -1;
    const R = 11 / S.zoom;
    for (let i = 0; i < (e.bends || []).length; i++) {
        if (ptDist(wx, wy, e.bends[i].x, e.bends[i].y) <= R) return i;
    }
    return -1;
}

// Hit test for edge endpoint handles (src port, tgt port)
function hitEndpointHandle(wx, wy, e) {
    if (!e) return null;
    const path = fullPath(e);
    if (!path.length) return null;
    const R = 11 / S.zoom;
    if (ptDist(wx, wy, path[0].x, path[0].y) <= R) return 'src';
    if (ptDist(wx, wy, path[path.length - 1].x, path[path.length - 1].y) <= R) return 'tgt';
    return null;
}

function hitAnyEdge(wx, wy) {
    const T = Math.max(5, 7 / S.zoom);
    for (let i = S.edges.length - 1; i >= 0; i--) {
        const path = fullPath(S.edges[i]);
        for (let j = 0; j < path.length - 1; j++) {
            if (segDist(wx, wy, path[j].x, path[j].y, path[j + 1].x, path[j + 1].y) < T) return S.edges[i];
        }
    }
    return null;
}

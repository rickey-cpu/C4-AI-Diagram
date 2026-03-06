// ─────────────────────────────────────────────────────────────
//  SNAP & PORT UTILS
// ─────────────────────────────────────────────────────────────
function snap(v) { return S.snapOn ? Math.round(v / SNAP) * SNAP : v; }

function snapPt(x, y, evt) {
    // Magnetic snap to nearest node port/center
    if (evt && evt.shiftKey) return { x, y };
    let bx = snap(x), by = snap(y), bd = MAGNET / S.zoom;
    S.nodes.forEach(n => {
        const ports = [
            { x: n.x + n.w / 2, y: n.y },       // top
            { x: n.x + n.w / 2, y: n.y + n.h },   // bottom
            { x: n.x, y: n.y + n.h / 2 }, // left
            { x: n.x + n.w, y: n.y + n.h / 2 }, // right
            { x: n.x + n.w / 2, y: n.y + n.h / 2 }, // center
        ];
        ports.forEach(p => {
            const d = Math.hypot(x - p.x, y - p.y);
            if (d < bd) { bd = d; bx = p.x; by = p.y; }
        });
    });
    return { x: bx, y: by };
}

// Border port: closest point on node border toward (tx,ty)
function getPort(node, tx, ty) {
    const cx = node.x + node.w / 2, cy = node.y + node.h / 2;
    const dx = tx - cx, dy = ty - cy;
    if (Math.abs(dy) * node.w > Math.abs(dx) * node.h) {
        const r = node.h / 2 / Math.abs(dy || .001);
        return dy > 0 ? { x: cx + dx * r, y: node.y + node.h } : { x: cx - dx * r, y: node.y };
    } else {
        const r = node.w / 2 / Math.abs(dx || .001);
        return dx > 0 ? { x: node.x + node.w, y: cy + dy * r } : { x: node.x, y: cy - dy * r };
    }
}

// ─────────────────────────────────────────────────────────────
//  ORTHOGONAL ROUTING  (draw.io mxEdgeStyle.OrthConnector logic)
// ─────────────────────────────────────────────────────────────
/*
  Given srcPort, array of user bends, tgtPort:
  Returns a polyline of strictly H/V segments.
  
  Rules (same as draw.io):
  1. If no bends: auto-route with 2 segments (L-shape) or 3 segments (S/Z-shape)
  2. If bends exist: connect sp→b[0]→...→b[N]→tp with L-jogs between each pair
  3. Each L-jog: horizontal first, then vertical (or vice versa for cleaner look)
*/
// ── orthoRoute: produces a strict H/V polyline (draw.io OrthogonalConnector) ──
// Key improvement: smarter jog direction based on port exit side + midpoint routing
function orthoRoute(sp, bends, tp) {
    if (bends.length === 0) {
        // Auto-route: pick best 2-3 segment path
        return autoRoute(sp, tp);
    }
    // With bends: connect each pair with L-jogs
    const chain = [sp, ...bends, tp];
    const pts = [{ ...chain[0] }];
    for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1];
        const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        if (dx < 0.5 || dy < 0.5) {
            pts.push({ x: b.x, y: b.y });
        } else {
            // Choose jog direction: prefer the axis where the distance is larger
            if (dx >= dy) {
                pts.push({ x: b.x, y: a.y }); // horizontal first
            } else {
                pts.push({ x: a.x, y: b.y }); // vertical first
            }
            pts.push({ x: b.x, y: b.y });
        }
    }
    return dedup(pts);
}

// Auto-route with no bends — draw.io style smart routing
function autoRoute(sp, tp) {
    const dx = tp.x - sp.x, dy = tp.y - sp.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    // Already aligned horizontally or vertically → straight line
    if (absDx < 1) return dedup([sp, { x: sp.x, y: tp.y }, tp]);
    if (absDy < 1) return dedup([sp, { x: tp.x, y: sp.y }, tp]);

    // Use midpoint S-route for clean bidirectional flow
    const midX = (sp.x + tp.x) / 2;
    const midY = (sp.y + tp.y) / 2;

    // Pick the axis for the middle segment based on aspect ratio
    if (absDx >= absDy) {
        // More horizontal span → mid horizontal segment
        return dedup([sp, { x: midX, y: sp.y }, { x: midX, y: tp.y }, tp]);
    } else {
        // More vertical span → mid vertical segment
        return dedup([sp, { x: sp.x, y: midY }, { x: tp.x, y: midY }, tp]);
    }
}

function dedup(pts) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i], q = out[out.length - 1];
        if (Math.abs(p.x - q.x) < 0.5 && Math.abs(p.y - q.y) < 0.5) continue;
        out.push(p);
    }
    return out;
}

function fullPath(e) {
    const src = S.nodes.find(n => n.id === e.src);
    const tgt = S.nodes.find(n => n.id === e.tgt);
    if (!src || !tgt) return [];
    const bends = e.bends || [];
    const firstAim = bends.length ? bends[0] : { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h / 2 };
    const lastAim = bends.length ? bends[bends.length - 1] : { x: src.x + src.w / 2, y: src.y + src.h / 2 };
    const sp = getPort(src, firstAim.x, firstAim.y);
    const tp = getPort(tgt, lastAim.x, lastAim.y);
    return orthoRoute(sp, bends, tp);
}

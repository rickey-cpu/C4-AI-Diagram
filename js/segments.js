// ─────────────────────────────────────────────────────────────
//  SEGMENT MANIPULATION  (draw.io core mechanic — clean rewrite)
// ─────────────────────────────────────────────────────────────
/*
  KEY INSIGHT: Never use delta-from-last-frame. Always track:
    - origBends: snapshot at mousedown
    - segY / segX: the locked axis value at mousedown
    - Apply absolute offset = snap(lockedValue + totalDelta) each frame

  initSegBends: called ONCE at mousedown if edge has no bends yet.
    Creates the minimal set of bends needed to make the segment slideable.

  applySegOffset: called EVERY mousemove frame.
    Takes origBends snapshot + target Y (or X) → produces new bends array.
    Pure function — no side effects on origBends.

  cleanBends: called ONCE at mouseup.
    Removes bends that became redundant after drag.
*/

// Called once at drag start when edge has no bends.
// Creates 2 explicit bend points that lock the segment position for sliding.
// Strategy: mirror what autoRoute() would produce, but as explicit bends.
function initSegBends(e, segI, isH, path) {
    if (path.length < 2) return;
    // The segment we want to slide is between path[segI] and path[segI+1]
    const a = path[segI], b = path[segI + 1];
    if (isH) {
        // H-segment at Y=a.y. We need bends that produce:
        //   sp → {x:?, y:a.y} → {x:?, y:a.y} → tp
        // Use the start/end X of the full path to anchor the bends
        const sp = path[0], tp = path[path.length - 1];
        e.bends = [{ x: sp.x, y: a.y }, { x: tp.x, y: a.y }];
    } else {
        // V-segment at X=a.x
        const sp = path[0], tp = path[path.length - 1];
        e.bends = [{ x: a.x, y: sp.y }, { x: a.x, y: tp.y }];
    }
}

// Apply absolute segment offset — core of smooth drag.
// origBends: snapshot from mousedown (never mutated).
// lockedY/newY: for H-segments. lockedX/newX: for V-segments.
function applySegOffset(e, origBends, lockedY, lockedX, newY, newX) {
    if (newY !== null) {
        // H-segment: move ALL bends that share the locked Y coord
        e.bends = origBends.map(b =>
            Math.abs(b.y - lockedY) < SNAP * 3 ? { x: b.x, y: newY } : { ...b }
        );
    } else {
        // V-segment: move ALL bends that share the locked X coord
        e.bends = origBends.map(b =>
            Math.abs(b.x - lockedX) < SNAP * 3 ? { x: newX, y: b.y } : { ...b }
        );
    }
}

// Remove collinear / redundant bends. Only called on mouseup.
function cleanBends(e) {
    if (!e.bends || e.bends.length < 2) return;
    const TOL = 3;
    // Pass 1: remove bends collinear with their neighbors
    let changed = true;
    while (changed) {
        changed = false;
        e.bends = e.bends.filter((b, i, arr) => {
            if (i === 0 || i === arr.length - 1) return true;
            const prev = arr[i - 1], next = arr[i + 1];
            if (Math.abs(prev.y - b.y) < TOL && Math.abs(b.y - next.y) < TOL) { changed = true; return false; }
            if (Math.abs(prev.x - b.x) < TOL && Math.abs(b.x - next.x) < TOL) { changed = true; return false; }
            return true;
        });
    }
    // Pass 2: if only 2 bends and they define a straight line back to route, clear them
    if (e.bends.length === 2) {
        const path = fullPath({ ...e, bends: [] });
        if (path.length >= 2) {
            const directPath = fullPath({ ...e, bends: [] });
            const withBends = fullPath(e);
            // If adding bends didn't change anything meaningful, remove them
            if (withBends.length === directPath.length) {
                let same = true;
                for (let i = 0; i < withBends.length; i++) {
                    if (Math.abs(withBends[i].x - directPath[i].x) > TOL || Math.abs(withBends[i].y - directPath[i].y) > TOL) { same = false; break; }
                }
                if (same) e.bends = [];
            }
        }
    }
}

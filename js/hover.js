// ─────────────────────────────────────────────────────────────
//  HOVER STATE MACHINE
// ─────────────────────────────────────────────────────────────
function updateHover(x, y, evt) {
    const tip = document.getElementById('tip');
    let newHover = null;

    if (S.tool === 'select') {
        // Priority: endpoint > bend > seg > node-port > node > edge
        let selE = null;
        if (S.selType === 'edge') selE = S.edges.find(e => e.id === S.sel);

        const ep = selE ? hitEndpointHandle(x, y, selE) : null;
        const bi = selE && !ep ? hitBendHandle(x, y, selE) : -1;
        const sh = !ep && bi < 0 ? hitSegHandle(x, y) : null;
        const hp = !ep && bi < 0 && !sh ? hitNodePort(x, y) : null;
        const hn = !ep && bi < 0 && !sh && !hp ? hitNode(x, y) : null;
        const he = !ep && bi < 0 && !sh && !hp && !hn ? hitAnyEdge(x, y) : null;

        if (ep) {
            newHover = { kind: 'endpoint', edge: selE, which: ep };
            cvs.style.cursor = 'crosshair';
            showTip(tip, evt, 'Kéo để di chuyển điểm kết nối');
            setHint('○ Endpoint — Kéo để thay đổi node kết nối');
        } else if (bi >= 0) {
            newHover = { kind: 'bend', edge: selE, idx: bi };
            cvs.style.cursor = 'move';
            showTip(tip, evt, 'Kéo tự do · Dbl-click xóa điểm này');
            setHint('● Bend — Kéo tự do  ·  Dbl-click: xóa');
        } else if (sh) {
            newHover = { kind: 'seg', edge: sh.edge, segI: sh.segI, isH: sh.isH };
            cvs.style.cursor = sh.isH ? 'ns-resize' : 'ew-resize';
            showTip(tip, evt, sh.isH ? 'Kéo lên/xuống để dịch chuyển segment' : 'Kéo trái/phải để dịch chuyển segment');
            setHint(sh.isH ? '━ H-Segment — Kéo ↕ để dịch chuyển  ·  Click để chọn edge' : '┃ V-Segment — Kéo ↔ để dịch chuyển  ·  Click để chọn edge');
        } else if (hp) {
            newHover = { kind: 'port', node: hp.node, side: hp.side };
            cvs.style.cursor = 'crosshair';
            showTip(tip, evt, 'Kéo để kết nối từ ' + hp.node.label);
            setHint('⟶ Port — Kéo để vẽ kết nối mới đến node khác');
        } else if (hn) {
            newHover = { kind: 'node', node: hn };
            cvs.style.cursor = 'move';
            showTip(tip, evt, '[' + hn.type.toUpperCase() + '] ' + hn.label + (hn.desc ? ' — ' + hn.desc : ''));
            setHint('↖ Node — Kéo để di chuyển  ·  Dbl-click đổi tên  ·  Chuột phải xóa');
        } else if (he) {
            newHover = { kind: 'edge', edge: he };
            cvs.style.cursor = 'pointer';
            showTip(tip, evt, (he.label ? '"' + he.label + '" · ' : '') + 'Click chọn · Kéo segment để uốn');
            setHint('⟶ Edge — Kéo segment để dịch chuyển  ·  Click để chọn  ·  Dbl-click đổi nhãn');
        } else {
            cvs.style.cursor = 'default';
            tip.style.display = 'none';
            setHint('↖ Hover lên line → kéo segment  ·  Kéo viền node → kết nối  ·  V/C/Space: đổi tool');
        }
    } else if (S.tool === 'connect') {
        const hn = hitNode(x, y);
        if (hn) {
            newHover = { kind: 'node', node: hn };
            cvs.style.cursor = 'crosshair';
            showTip(tip, evt, S.conn ? 'Click → nối đến ' + hn.label : 'Click → bắt đầu từ ' + hn.label);
        } else { cvs.style.cursor = 'crosshair'; tip.style.display = 'none'; }
        setHint(S.conn ? '⟶ Click node đích để hoàn thành  ·  Esc huỷ' : '⟶ Click node nguồn để bắt đầu kết nối');
    } else if (S.tool === 'pan') {
        cvs.style.cursor = S.panStart ? 'grabbing' : 'grab';
        tip.style.display = 'none';
        setHint('✥ Pan — Kéo để di chuyển canvas  ·  Scroll để zoom');
    }

    S.hover = newHover;
}
function showTip(tip, evt, text) {
    tip.style.display = 'block';
    tip.style.left = (evt.clientX + 16) + 'px';
    tip.style.top = (evt.clientY - 10) + 'px';
    tip.textContent = text;
}
function setHint(text) {
    document.getElementById('hintbar').textContent = text;
}

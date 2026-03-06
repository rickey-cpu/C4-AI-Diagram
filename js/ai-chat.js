// ─────────────────────────────────────────────────────────────
//  API KEY & CHAT
// ─────────────────────────────────────────────────────────────
function saveKey() {
    const v = document.getElementById('apikey').value;
    if (v && !v.startsWith('•')) {
        S.apiKey = v.trim(); localStorage.setItem('c4key', S.apiKey);
        document.getElementById('apikey').value = '•'.repeat(24);
        document.getElementById('ksave').classList.add('ok');
        document.getElementById('ksave').textContent = '✓';
        addMsg('ai', '✅ API key đã lưu!');
    }
}
function addMsg(role, html) {
    const c = document.getElementById('msgs'), d = document.createElement('div');
    d.className = 'msg ' + (role === 'ai' ? 'ai' : 'u');
    d.innerHTML = '<div class="mav">' + (role === 'ai' ? '✦' : '👤') + '</div><div class="mbub">' + html + '</div>';
    c.appendChild(d); c.scrollTop = c.scrollHeight;
}
function dbg(m) { const b = document.getElementById('dbgbox'); b.classList.add('show'); b.textContent = m; }
function hideDbg() { document.getElementById('dbgbox').classList.remove('show'); }
function qmsg(t) { document.getElementById('pinp').value = t; send(); }
function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function setThink(v) { document.getElementById('aidot').classList.toggle('spin', v); document.getElementById('sbtn').disabled = v; document.getElementById('stxt').textContent = v ? 'AI generating...' : 'Ready'; }
async function send() {
    const inp = document.getElementById('pinp'), text = inp.value.trim();
    if (!text) return;
    if (!S.apiKey) { addMsg('ai', '⚠️ Nhập <b>Anthropic API Key</b> rồi nhấn Save.'); return; }
    inp.value = ''; addMsg('user', text); setThink(true); hideDbg();
    try { const data = await callClaude(text); renderJSON(data); addMsg('ai', '✅ C4 Level ' + S.level + ' — <b>' + (data.nodes?.length || 0) + ' nodes</b>, <b>' + (data.edges?.length || 0) + ' edges</b>.<div class="chips"><button class="chip g" onclick="autoLayout()">⟳ Layout</button><button class="chip" onclick="exportSVG()">⤓ SVG</button><button class="chip" onclick="qmsg(\'Add more detail\')">+ Detail</button></div>'); }
    catch (err) { dbg(err.message); addMsg('ai', '❌ ' + err.message.substring(0, 120)); }
    setThink(false);
}
async function callClaude(prompt) {
    const lvD = { 1: 'System Context: persons,system,external', 2: 'Containers: web app,API,databases,mobile', 3: 'Components: controllers,services,repos', 4: 'Code: classes,interfaces' };
    const sys = 'C4 JSON generator. ONLY raw JSON.\n{"title":"str","nodes":[{"id":"id","type":"person|system|container|component|database|external","label":"Name","desc":"tech","x":num,"y":num}],"edges":[{"src":"id","tgt":"id","label":"action"}]}\nCanvas 900x580. No overlaps. Persons y=60. System y=200. Databases y=380. 7-12 nodes.';
    dbg('Calling API...');
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': S.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: sys, messages: [{ role: 'user', content: prompt }] }) });
    const raw = await r.json(); dbg('HTTP ' + r.status + '\n' + JSON.stringify(raw).substring(0, 400));
    if (!r.ok) throw new Error(raw.error?.message || 'HTTP ' + r.status);
    const txt = raw.content?.[0]?.text || ''; if (!txt) throw new Error('Empty response');
    const s = txt.indexOf('{'), en = txt.lastIndexOf('}'); if (s < 0 || en < 0) throw new Error('No JSON');
    try { const p = JSON.parse(txt.slice(s, en + 1)); hideDbg(); return p; } catch (pe) { throw new Error('JSON parse: ' + pe.message); }
}
function renderJSON(data) {
    S.nodes = []; S.edges = []; S.nid = 1; const idMap = {};
    (data.nodes || []).forEach(n => { const sz = NSZ[n.type] || { w: 135, h: 78 }; const node = { id: 'n' + (S.nid++), type: n.type || 'system', label: String(n.label || 'Node'), desc: String(n.desc || ''), x: (n.x || 100) - sz.w / 2, y: (n.y || 100) - sz.h / 2, w: sz.w, h: sz.h }; S.nodes.push(node); idMap[n.id] = node.id; });
    (data.edges || []).forEach(e => { const s = idMap[e.src], t = idMap[e.tgt]; if (s && t) S.edges.push({ id: 'e' + (S.nid++), src: s, tgt: t, label: String(e.label || ''), bends: [], color: null, width: 1.5, dash: [6, 3] }); });
    draw(); upd(); setTimeout(fitView, 80);
}

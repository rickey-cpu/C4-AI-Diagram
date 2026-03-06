// ─────────────────────────────────────────────────────────────
//  INITIALIZATION
// ─────────────────────────────────────────────────────────────

// Restore API key if saved
if (S.apiKey) {
    document.getElementById('apikey').value = '•'.repeat(24);
    document.getElementById('ksave').classList.add('ok');
    document.getElementById('ksave').textContent = '✓';
}

// Welcome message
addMsg('ai', '<b>C4 AI Architect</b> v8<br><br>🎯 <b>Draw.io-style edges:</b><br>• Hover line → thấy handle ngay, kéo luôn<br>• Kéo segment ngang/dọc độc lập như draw.io<br>• Kéo viền node để kết nối<br>• Snap grid + magnetic port tự động<br><div class="chips"><button class="chip" onclick="qmsg(\'Hệ thống đặt vé máy bay\')">✈️ Đặt vé</button><button class="chip g" onclick="qmsg(\'App giao đồ ăn GrabFood\')">🍜 Food App</button><button class="chip" onclick="qmsg(\'Fintech chuyển tiền realtime\')">💸 Fintech</button></div>');

// Initialize theme and canvas
setTimeout(() => { setTheme('light'); resize(); }, 60);

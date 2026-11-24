// =====================================================================
//  ÇAKABEY ZİNDANI — Öğretmenler ve Ejderha Buncaişinarasındahayatlaradokunma
//  Saf HTML5 Canvas + JavaScript. Kurulum gerektirmez; index.html'i açın.
// =====================================================================
'use strict';
(() => {
const TILE = 48, VW = 960, VH = 624;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const FONT = '"Segoe UI",Tahoma,Verdana,Arial,sans-serif';

// ---------------------------------------------------------------- utils
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (a, b, c, d) => Math.hypot(c - a, d - b);
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function wrap(c, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------- input
const keys = {}, pressed = {};
const CODEMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'atk', KeyJ: 'atk', KeyE: 'sp', KeyK: 'sp', Digit1: 'h1', Digit2: 'h2', Digit3: 'h3', Numpad1: 'h1', Numpad2: 'h2', Numpad3: 'h3',
  KeyQ: 'next', Tab: 'next', Enter: 'ok', NumpadEnter: 'ok', KeyM: 'mute', Escape: 'pause', KeyP: 'pause' };
addEventListener('keydown', e => { const a = CODEMAP[e.code]; if (!a) return; e.preventDefault(); if (!keys[a]) pressed[a] = true; keys[a] = true; initAudio(); });
addEventListener('keyup', e => { const a = CODEMAP[e.code]; if (a) keys[a] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
// dokunmatik kontroller
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  const tp = document.getElementById('touch'); tp.classList.add('on');
  tp.querySelectorAll('.tb').forEach(b => {
    const a = b.dataset.a;
    const on = e => { e.preventDefault(); initAudio(); if (!keys[a]) pressed[a] = true; keys[a] = true; };
    const off = e => { e.preventDefault(); keys[a] = false; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  cv.addEventListener('pointerdown', () => { pressed.ok = true; initAudio(); });
}
function fit() { const s = Math.min(innerWidth / VW, innerHeight / VH); cv.style.width = (VW * s) + 'px'; cv.style.height = (VH * s) + 'px'; }
addEventListener('resize', fit); fit();

// ---------------------------------------------------------------- audio
let AC = null, muted = false;
function initAudio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); }
function tone(type, f0, f1, dur, vol = 0.08, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SFX = {
  laser: () => tone('square', 1300, 260, 0.12, 0.035),
  heart: () => tone('sine', 620, 1150, 0.15, 0.06),
  melee: () => { tone('triangle', 420, 880, 0.1, 0.07); tone('sine', 900, 1300, 0.1, 0.04, 0.05); },
  heal: () => [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, 0.2, 0.06, i * 0.07)),
  portal: () => { tone('sine', 180, 1500, 0.35, 0.07); tone('triangle', 90, 700, 0.35, 0.04); },
  giraffe: () => { tone('triangle', 260, 170, 0.25, 0.08); tone('triangle', 330, 210, 0.22, 0.06, 0.16); },
  hit: () => tone('square', 230, 80, 0.1, 0.05),
  hurt: () => tone('sawtooth', 320, 90, 0.25, 0.07),
  pickup: () => { tone('sine', 700, 700, 0.08, 0.06); tone('sine', 1050, 1050, 0.12, 0.06, 0.08); },
  block: () => tone('square', 140, 130, 0.08, 0.05),
  roar: () => { tone('sawtooth', 130, 40, 1.0, 0.11); tone('square', 95, 30, 1.0, 0.05); },
  sw: () => tone('sine', 500, 950, 0.09, 0.05),
  blip: () => tone('square', 760 + Math.random() * 80, 760, 0.02, 0.012),
  brk: () => { tone('square', 520, 60, 0.25, 0.06); tone('triangle', 1200, 200, 0.2, 0.03); },
  lever: () => { tone('square', 300, 300, 0.06, 0.05); tone('square', 600, 600, 0.12, 0.05, 0.08); },
  win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.24, 0.07, i * 0.13)),
  die: () => tone('sawtooth', 420, 60, 0.6, 0.08),
  open: () => [392, 523, 659].forEach((f, i) => tone('triangle', f, f, 0.15, 0.06, i * 0.08)),
};
function sfx(n) { try { SFX[n] && SFX[n](); } catch (e) { } }

// ---------------------------------------------------------------- heroes
const HERO_IDS = ['oguzhan', 'seyda', 'aykutcan'];
const HERO = {
  oguzhan: { name: 'Oğuzhan', maxHp: 10, col: '#47d4ff', key: '1', atk: 'Lazer', sp: 'Portal', atkCd: 0.28, spCd: 1.1 },
  seyda: { name: 'Şeyda', maxHp: 10, col: '#ff6fcf', key: '2', atk: 'Pembe Büyü', sp: 'Zürafa', atkCd: 0.34, spCd: 2.2 },
  aykutcan: { name: 'Aykutcan', maxHp: 14, col: '#ffd34d', key: '3', atk: 'Neşe Dalgası', sp: 'Şifa Işığı', atkCd: 0.42, spCd: 5 },
};
const QUOTES = {
  oguzhan: ['Wubba lubba dub dub!', 'Gir-çık, 20 dakikalık macera!', 'Ben Turşu Oğuzhan!', 'Schwifty olma zamanı!',
    'Bunu bir Meeseeks\'e yaptırsam varoluşsal kriz geçirirdi.', 'Bu zindan bana C-137 boyutunu hatırlattı.',
    '*geğirir* Pardon. Bilim böyle bir şey.', 'Portal silahım dolu, hadi bakalım!', 'Szechuan sosu kadar nadir bir an!',
    'Sonsuz boyut var, en iyi öğretmenler bu boyutta!', 'Plumbus olsa bunu da tamir ederdi.', 'Hiç kimse bir yere ait değil... ama ders saat 9\'da!'],
  seyda: ['Zürafa gücü!', 'Boynu uzun, kalbi daha uzun!', 'Pembe enerji, kötü enerjiye karşı!', 'Benekli dostum, hücum!',
    'Bilgi: Zürafaların dili 45 cm\'dir!', 'Zürafalar asla pes etmez!', 'Sevgiyle büyüyen her şey uzar!'],
  aykutcan: ['Gülümse, her şey güzel olacak!', 'Kim yorgun? Kimse!', 'Şifa geliyor, çay da benden!', 'Moraller yüksek, ekip!',
    'Bir kahkaha bin ilaç!', 'Hadi bakalım, sağlıcakla!', 'Bugün de harika bir gün!'],
};
const SPK = {
  oguzhan: { name: 'Oğuzhan', col: '#47d4ff' }, seyda: { name: 'Şeyda', col: '#ff6fcf' }, aykutcan: { name: 'Aykutcan', col: '#ffd34d' },
  zeynep: { name: 'Zeynep', col: '#5fe0a0' }, ekin: { name: 'Ekin', col: '#ffae5c' }, tibet: { name: 'Tibet', col: '#ff6a6a' },
  mertata: { name: 'Mert Ata', col: '#b78cff' }, dragon: { name: 'Buncaişinarasındahayatlaradokunma', col: '#ff9a3c' },
  narrator: { name: 'Anlatıcı', col: '#d8d2c0' },
};
const NPCCFG = {
  zeynep: { skin: '#f1c19a', hair: '#4b2c1d', hairStyle: 'long', shirt: '#2f9e6b', pants: '#2b3550', shoes: '#3a2a22' },
  ekin: { skin: '#f3c6a3', hair: '#b5622f', hairStyle: 'long', glasses: true, shirt: '#f08a2c', pants: '#3b4a7a', shoes: '#2a2a2a' },
  tibet: { skin: '#e9b48d', hair: '#1b1b22', hairStyle: 'spiky', shirt: '#a3263a', pants: '#1f1f28', shoes: '#111', cape: '#5a1020', brows: true, belt: '#d4af37' },
  mertata: { skin: '#e4ae86', hair: '#5a3a22', hairStyle: 'short', beard: '#4a2f1c', robe: true, shirt: '#5b2a86', shoes: '#222', brows: true, belt: '#c9a0ff' },
};

// ---------------------------------------------------------------- sprites
const FR_W = 128, FR_H = 228, DH = 78, DW = Math.round(FR_W * DH / FR_H);
const SPR = {};
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; }); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function prerender(img) {
  const frames = [], flipped = [];
  for (let i = 0; i < 5; i++) {
    const mid = mk(FR_W / 2, FR_H / 2), m = mid.getContext('2d');
    m.imageSmoothingQuality = 'high'; m.drawImage(img, i * FR_W, 0, FR_W, FR_H, 0, 0, FR_W / 2, FR_H / 2);
    const c = mk(DW, DH), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(mid, 0, 0, DW, DH); frames.push(c);
    const f = mk(DW, DH), fx = f.getContext('2d'); fx.translate(DW, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0); flipped.push(f);
  }
  // portre: karakterin en üst pikselinden başlayarak kafayı kırp
  const tmp = mk(FR_W, FR_H), tx = tmp.getContext('2d'); tx.drawImage(img, 0, 0, FR_W, FR_H, 0, 0, FR_W, FR_H);
  let top = 10;
  try { // file:// ile açıldığında tuval "kirli" sayılabilir; o zaman varsayılanı kullan
    const d = tx.getImageData(0, 0, FR_W, FR_H).data;
    outer: for (let y = 0; y < FR_H; y++) for (let x = 0; x < FR_W; x++) if (d[(y * FR_W + x) * 4 + 3] > 40) { top = y; break outer; }
  } catch (e) { }
  const p = mk(64, 64), px = p.getContext('2d'); px.imageSmoothingQuality = 'high'; px.drawImage(img, 12, Math.max(0, top - 2), 104, 104, 0, 0, 64, 64);
  return { frames, flipped, portrait: p, img };
}
function npcPortrait(id) {
  const p = mk(64, 64), c = p.getContext('2d');
  c.fillStyle = '#2a2438'; c.fillRect(0, 0, 64, 64);
  drawHuman(c, 32, 112, NPCCFG[id], 0, false, false, 5);
  return p;
}
function dragonPortrait() {
  const p = mk(64, 64), c = p.getContext('2d'); c.fillStyle = '#3a1418'; c.fillRect(0, 0, 64, 64);
  drawDragon(c, 32, -10, 0, { s: 0.55, noWings: true }); return p;
}
function narratorPortrait() {
  const p = mk(64, 64), c = p.getContext('2d'); c.fillStyle = '#2b2416'; c.fillRect(0, 0, 64, 64);
  c.fillStyle = '#e9d9a6'; c.fillRect(12, 14, 40, 36); c.fillStyle = '#c4b07a'; c.fillRect(8, 10, 48, 8); c.fillRect(8, 46, 48, 8);
  c.fillStyle = '#7a5a2a'; for (let i = 0; i < 4; i++) c.fillRect(17, 22 + i * 6, 30 - (i % 2) * 8, 2);
  return p;
}

// --- prosedürel insan çizimi (NPC ve düşmanlar için piksel-art tarzı)
function drawHuman(c, x, y, o, t, moving, flip, u = 4, alpha = 1) {
  c.save(); c.globalAlpha *= alpha; c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1);
  const s = moving ? Math.sin(t * 11) : 0; const P = []; const R = (a, b, w, h, col) => P.push([a, b, w, h, col]);
  if (o.cape) R(-5.6, -12.5, 2.6, 10.5, o.cape);
  R(-5.2 - s * 0.4, -11.8, 1.6, 5.5, o.shirt); R(-5.2 - s * 0.4, -6.6, 1.6, 1.4, o.skin);
  if (o.robe) { R(-4.6, -7, 9.2, 6.6, o.shirt); R(-3.6, -1, 3, 1.1, o.shoes); R(1, -1, 3, 1.1, o.shoes); }
  else { R(-3.6 + s, -5.5, 3.2, 4.8, o.pants); R(0.4 - s, -5.5, 3.2, 4.8, o.pants); R(-3.8 + s, -1.2, 3.6, 1.4, o.shoes); R(0.4 - s, -1.2, 3.8, 1.4, o.shoes); }
  R(-4.2, -12.5, 8.4, 7.2, o.shirt);
  if (o.belt) R(-4.2, -6.2, 8.4, 0.9, o.belt);
  if (o.hairStyle === 'long') R(-5, -19.5, 4.5, 10.5, o.hair);
  R(-4, -19.5, 8, 7.5, o.skin);
  R(-4.6, -20.8, 9.2, 2.8, o.hair); R(-4.6, -18.5, 2.6, 3.5, o.hair);
  if (o.hairStyle === 'spiky') { R(-4, -22.3, 2, 1.6, o.hair); R(-1, -22.8, 2, 2.1, o.hair); R(2, -22.3, 2, 1.6, o.hair); }
  if (o.hairStyle === 'long') R(2.4, -20, 2.2, 2.2, o.hair);
  if (o.beard) R(-1, -14.6, 5.3, 2.8, o.beard);
  R(3.6 + s * 0.4, -11.8, 1.6, 5.5, o.shirt); R(3.6 + s * 0.4, -6.6, 1.6, 1.4, o.skin);
  c.fillStyle = '#1c1422';
  for (const [a, b, w, h] of P) c.fillRect((a - 0.35) * u, (b - 0.35) * u, (w + 0.7) * u, (h + 0.7) * u);
  for (const [a, b, w, h, col] of P) { c.fillStyle = col; c.fillRect(a * u, b * u, w * u, h * u); }
  const F = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a * u, b * u, w * u, h * u); };
  F(0.6, -16.8, 1, 1.4, '#1b1420'); F(2.8, -16.8, 1, 1.4, '#1b1420');
  if (o.brows) { F(0.2, -18.1, 1.8, 0.6, '#2a1a14'); F(2.6, -18.3, 1.8, 0.6, '#2a1a14'); }
  if (o.glasses) { c.strokeStyle = '#222'; c.lineWidth = Math.max(1, u * 0.3); c.strokeRect(0.1 * u, -17.4 * u, 2 * u, 2 * u); c.strokeRect(2.4 * u, -17.4 * u, 2 * u, 2 * u); }
  if (!o.beard) { if (o.mood === 'sad') F(1.5, -13.6, 2.2, 0.5, '#6b2f2f'); else F(1.4, -14.2, 2.4, 0.7, '#b0484a'); }
  F(-1.2, -15.5, 1.3, 1, 'rgba(255,110,110,0.35)');
  c.restore();
}
function drawGiraffe(c, x, y, t, flip, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1);
  const Y = '#f2c14e', B = '#9a5b2b', O = '#3a2414', l = Math.sin(t * 18) * 4;
  const P = [[-17 + l, -22, 4, 22, Y], [-10 - l, -22, 4, 22, Y], [8 + l, -22, 4, 22, Y], [14 - l, -22, 4, 22, Y],
    [-24, -33, 4, 11, B], [-20, -36, 39, 15, Y], [10, -68, 9, 36, Y], [12, -76, 19, 11, Y], [25, -72, 8, 7, '#e8b04a'],
    [14, -82, 3, 7, B], [20, -82, 3, 7, B]];
  c.fillStyle = O; for (const [a, b, w, h] of P) c.fillRect(a - 1.5, b - 1.5, w + 3, h + 3);
  for (const [a, b, w, h, col] of P) { c.fillStyle = col; c.fillRect(a, b, w, h); }
  c.fillStyle = B; for (const [a, b, w, h] of [[-15, -33, 6, 5], [-5, -30, 7, 6], [6, -34, 6, 5], [12, -60, 5, 5], [14, -48, 4, 5], [-12, -26, 4, 3], [2, -26, 5, 3]]) c.fillRect(a, b, w, h);
  c.fillStyle = '#3a2a1a'; c.fillRect(13, -84, 5, 4); c.fillRect(19, -84, 5, 4);
  c.fillStyle = '#111'; c.fillRect(24, -73, 3, 3);
  c.fillStyle = '#ff6fcf'; c.fillRect(10, -40, 9, 4); // pembe fular
  c.fillStyle = 'rgba(255,120,120,.5)'; c.fillRect(22, -68, 3, 2);
  c.restore();
}
function drawPaper(c, x, y, t, flash, big) {
  const b = Math.abs(Math.sin(t * 6)) * 5, s = big ? 1.25 : 1;
  c.save(); c.translate(Math.round(x), Math.round(y - b)); c.scale(s, s);
  c.fillStyle = '#1c1422'; c.fillRect(-17, -35, 34, 36);
  c.fillStyle = flash > 0 ? '#ffffff' : '#f4f0e0'; c.fillRect(-15, -33, 30, 32);
  c.fillStyle = '#d9d2b8'; c.fillRect(7, -33, 8, 8);
  c.fillStyle = '#7fa6d9'; for (let i = 0; i < 4; i++) c.fillRect(-12, -22 + i * 6, 24, 1.5);
  c.fillStyle = '#d62e2e'; c.font = 'bold 13px ' + FONT; c.fillText('0', 6, -4);
  c.strokeStyle = '#d62e2e'; c.lineWidth = 1.5; c.beginPath(); c.arc(10, -8, 7, 0, 7); c.stroke();
  c.fillStyle = '#111'; c.fillRect(-9, -25, 4, 5); c.fillRect(1, -25, 4, 5);
  c.fillStyle = '#d62e2e'; c.fillRect(-11, -28, 6, 2); c.fillRect(1, -28, 6, 2);
  c.restore();
}
function drawBat(c, x, y, t, flash) {
  const yy = y - 30 + Math.sin(t * 5) * 6, w = Math.sin(t * 22) * 10;
  c.save(); c.translate(Math.round(x), Math.round(yy));
  c.fillStyle = flash > 0 ? '#fff' : '#3b1f57';
  c.beginPath(); c.moveTo(-6, 0); c.lineTo(-26, -8 + w); c.lineTo(-20, 4); c.lineTo(-12, 2 + w * 0.3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(6, 0); c.lineTo(26, -8 + w); c.lineTo(20, 4); c.lineTo(12, 2 + w * 0.3); c.closePath(); c.fill();
  c.fillStyle = flash > 0 ? '#fff' : '#5b2f82'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
  c.fillStyle = '#ff5ad2'; c.fillRect(-5, -3, 3, 3); c.fillRect(2, -3, 3, 3);
  c.restore();
}
function drawHeart(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath();
  c.moveTo(0, 4); c.bezierCurveTo(-8, -2, -5, -9, 0, -5); c.bezierCurveTo(5, -9, 8, -2, 0, 4); c.fill(); c.restore();
}
function drawSimit(c, x, y, t) {
  const b = Math.sin(t * 4) * 3;
  c.save(); c.translate(x, y - 12 + b);
  c.strokeStyle = '#5a2e0e'; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.stroke();
  c.strokeStyle = '#b5652a'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.stroke();
  c.fillStyle = '#f7e7b5'; for (let i = 0; i < 8; i++) { const a = i * 0.8; c.fillRect(Math.cos(a) * 9 - 1, Math.sin(a) * 9 - 1, 2, 2); }
  c.restore();
}
const SHIELD_COL = { blue: '#4fc3ff', pink: '#ff6fcf', dark: '#a35cff', gold: '#ffd34d' };
const SHIELD_NEED = { blue: 'oguzhan', pink: 'seyda', dark: 'seyda', gold: 'aykutcan' };
const SHIELD_TXT = {
  blue: 'MAVİ TEKNO-KALKAN — sadece Oğuzhan (1) hasar verebilir',
  pink: 'PEMBE KALKAN — sadece Şeyda (2) hasar verebilir',
  dark: 'MOR KASVET KALKANI — sadece Şeyda\'nın pembe büyüsü (2) deler',
  gold: 'ALTIN KEDER KALKANI — sadece Aykutcan\'ın neşesi (3) çözer',
};
function drawDragon(c, x, y, t, o) {
  const s = o.s || 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  const body = o.flash > 0 ? '#ffffff' : (o.cute ? '#d9475b' : '#a3263a'), dark = '#6d1626', belly = '#f0b25a';
  if (!o.noWings) {
    c.strokeStyle = dark; c.lineWidth = 18; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -30);
    c.quadraticCurveTo(60 * Math.sin(t * 1.5), -110, -20, -140); c.stroke();
    const flap = Math.sin(t * 3) * 0.22;
    for (const side of [-1, 1]) {
      c.save(); c.scale(side, 1); c.rotate(-flap);
      c.fillStyle = '#7a1d2e'; c.strokeStyle = '#3a0b14'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(30, -20); c.lineTo(150, -95); c.lineTo(135, -35); c.lineTo(170, 5); c.lineTo(115, 0); c.lineTo(122, 40); c.lineTo(40, 20); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#4e1020'; c.lineWidth = 3; c.beginPath(); c.moveTo(40, -5); c.lineTo(150, -95); c.moveTo(40, 0); c.lineTo(168, 5); c.moveTo(40, 8); c.lineTo(122, 40); c.stroke();
      c.restore();
    }
  }
  c.fillStyle = '#2a0810'; c.beginPath(); c.ellipse(0, 0, 74, 62, 0, 0, 7); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 70, 58, 0, 0, 7); c.fill();
  c.fillStyle = belly; c.beginPath(); c.ellipse(0, 14, 40, 38, 0, 0, 7); c.fill();
  c.strokeStyle = '#c98a3a'; c.lineWidth = 3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-30, 14 + i * 12); c.lineTo(30, 14 + i * 12); c.stroke(); }
  if (!o.cute) { // gövdeye yapışmış evraklar
    for (const [px, py, r] of [[-48, -14, 0.4], [40, -28, -0.3], [-14, -40, 0.15], [48, 18, 0.6]]) {
      c.save(); c.translate(px, py); c.rotate(r); c.fillStyle = '#f4f0e0'; c.fillRect(-9, -11, 18, 22);
      c.fillStyle = '#7fa6d9'; for (let i = 0; i < 3; i++) c.fillRect(-6, -5 + i * 5, 12, 1.5); c.restore();
    }
  }
  // kafa
  c.fillStyle = '#2a0810'; c.beginPath(); c.ellipse(0, 55, 46, 36, 0, 0, 7); c.fill();
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 55, 42, 32, 0, 0, 7); c.fill();
  c.fillStyle = '#f3e6c4'; c.strokeStyle = '#2a0810'; c.lineWidth = 3;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 26, 34); c.lineTo(sd * 52, 2); c.lineTo(sd * 36, 40); c.closePath(); c.fill(); c.stroke(); }
  c.fillStyle = o.flash > 0 ? '#fff' : '#c2364b'; c.beginPath(); c.ellipse(0, 76, 26, 15, 0, 0, 7); c.fill();
  c.fillStyle = '#2a0810'; c.fillRect(-9, 72, 5, 4); c.fillRect(4, 72, 5, 4);
  if (o.cute) {
    for (const sd of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sd * 16, 50, 10, 0, 7); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(sd * 16, 51, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(sd * 16 - 3, 46, 3, 3); }
    c.strokeStyle = '#2a0810'; c.lineWidth = 3; c.beginPath(); c.arc(0, 80, 8, 0.2, Math.PI - 0.2); c.stroke();
  } else {
    for (const sd of [-1, 1]) {
      c.fillStyle = '#ffd23a'; c.beginPath(); c.ellipse(sd * 17, 50, 8, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#111'; c.fillRect(sd * 17 - 1.5, 45, 3, 10);
      c.strokeStyle = '#2a0810'; c.lineWidth = 4; c.beginPath(); c.moveTo(sd * 8, 40); c.lineTo(sd * 27, 45); c.stroke();
    }
  }
  if (o.breath > 0) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30); c.fillStyle = '#ff9a2e'; c.beginPath(); c.ellipse(0, 90, 18 * o.breath + 4, 10 * o.breath + 3, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  if (o.shield) {
    const col = SHIELD_COL[o.shield];
    c.globalAlpha = 0.13 + 0.05 * Math.sin(t * 4); c.fillStyle = col; c.beginPath(); c.arc(0, 15, 125, 0, 7); c.fill();
    c.globalAlpha = 0.85; c.strokeStyle = col; c.lineWidth = 4; c.setLineDash([18, 10]); c.lineDashOffset = -t * 60;
    c.beginPath(); c.arc(0, 15, 125, 0, 7); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
  c.restore();
}

// ---------------------------------------------------------------- maps
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function rect(g, x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; }
const T = (x, y) => [x * TILE + TILE / 2, y * TILE + TILE / 2];

const MAPS = [
  { // ---------------------------------------------------------------- 0
    title: 'Çakabey Okulu — Arka Bahçe', theme: 'outdoor', floor: ',',
    build() {
      const g = grid(32, 18, 'T'); rect(g, 1, 1, 30, 16, ','); rect(g, 1, 8, 30, 9, '.');
      rect(g, 9, 1, 10, 16, '~'); rect(g, 17, 1, 17, 16, 'B'); rect(g, 18, 1, 22, 16, 'F'); rect(g, 27, 1, 27, 16, 'G');
      g[0][24] = 'L'; rect(g, 3, 4, 4, 5, 'w'); rect(g, 12, 2, 13, 2, 'w');
      for (const [x, y] of [[13, 4], [15, 12], [5, 13], [29, 13], [7, 2], [12, 14], [29, 3], [2, 15], [6, 11]]) g[y][x] = 'T';
      g[8][30] = 'X'; g[9][30] = 'X'; return g;
    },
    start: [2, 9],
    spawns: [['slime', 13, 6], ['slime', 14, 11], ['slime', 24, 12], ['slime', 29, 6]],
    npcs: [['zeynep', 4, 7]], items: [[12, 9], [25, 2], [20, 14]],
    obj: 'Zindanın girişine ulaş (doğuda).',
    exitOk: () => true,
    onStart(retry) {
      if (G.flags.intro0) return;
      G.flags.intro0 = true;
      say([
        ['narrator', 'Çakabey Okulu. Dönemin son haftası... Ama okulun altındaki kadim Çakabey Zindanı\'ndan korkunç bir kükreme yükseliyor.'],
        ['zeynep', 'Hocalarım! Yetişin! Ejderha Buncaişinarasındahayatlaradokunma uyandı!'],
        ['aykutcan', 'Günaydın Zeynep Hocam! Ejderha mı? Harika, tam da sabah sporu lazımdı!'],
        ['zeynep', 'Şaka değil! Okuldaki bütün neşeyi ve öğrencilere ayırdığımız zamanı evrak yığınlarına çeviriyor!'],
        ['seyda', 'Öğrencilerimizden zaman çalmak mı? Zürafalarım bunu duymasın... Aa, duydular bile!'],
        ['oguzhan', 'Ejderha, zindan, kayıp neşe... Klasik bir Salı. Gir-çık, 20 dakikalık macera millet!'],
        ['zeynep', 'Zindanın girişi doğuda. Yol zor ama üçünüzün yetenekleri birbirini tamamlıyor.'],
        ['zeynep', '1 - 2 - 3 tuşlarıyla (ya da Q) öğretmen değiştirin. SPACE saldırı, E özel yetenek!'],
        ['zeynep', 'Oğuzhan Hocam: lazer + portal atlayışı. Uçurumları portalla geçer, enerji bariyerlerini lazerle kırar.'],
        ['zeynep', 'Şeyda Hocam: pembe büyü + zürafa çağırma. Zürafası yüksek şalterlere uzanabilir!'],
        ['zeynep', 'Aykutcan Hocam: neşe dalgası + şifa ışığı. Herkesi iyileştirir, bayılanı kaldırır ve kasvet sisinden etkilenmez!'],
        ['aykutcan', 'Çünkü ben hep neşeliyim! Hadi ekip, gülümseyerek gidiyoruz!'],
      ]);
    },
  },
  { // ---------------------------------------------------------------- 1
    title: 'Çakabey Zindanı — 1. Kat: Evrak Koridorları', theme: 'dungeon', floor: '.',
    build() {
      const g = grid(40, 24, '#');
      rect(g, 1, 15, 10, 22, '.'); rect(g, 4, 10, 6, 14, '.'); rect(g, 4, 12, 6, 12, 'B');
      rect(g, 1, 1, 12, 9, '.'); rect(g, 13, 1, 15, 9, '~'); rect(g, 16, 1, 26, 9, '.');
      rect(g, 20, 10, 22, 14, 'F'); rect(g, 14, 15, 27, 22, '.');
      rect(g, 28, 17, 29, 19, '.'); rect(g, 28, 17, 28, 19, 'B');
      rect(g, 30, 1, 38, 22, '.');
      for (const [x, y] of [[32, 6], [36, 6], [32, 17], [36, 17], [8, 3], [19, 5], [24, 4], [18, 19], [23, 18]]) g[y][x] = '#';
      rect(g, 30, 10, 31, 13, 'F'); rect(g, 37, 10, 38, 13, 'F');
      g[1][34] = 'X'; g[1][35] = 'X'; return g;
    },
    start: [5, 19],
    spawns: [['slime', 8, 17], ['slime', 3, 3], ['slime', 9, 7], ['slime', 11, 2], ['bat', 6, 5],
      ['bat', 20, 3], ['bat', 25, 7], ['slime', 18, 7], ['slime', 17, 17], ['slime', 22, 21], ['slime', 26, 16], ['bat', 20, 16],
      ['tibet', 34, 11, () => !G.flags.tibet]],
    npcs: [], items: [[2, 21], [11, 8], [26, 21], [30, 21], [16, 2]],
    obj: 'Evrak Koridorları\'nı geç. Kuzeyden başla.',
    exitOk: () => !!G.flags.tibet,
    exitMsg: () => 'Merdiven mühürlü! Önce Tibet\'i yenmelisin.',
    triggers: [
      { id: 'roomC', x0: 16, y0: 1, x1: 26, y1: 9, fn() { if (G.flags.t1c) return; G.flags.t1c = true; say([['oguzhan', 'Bu kâğıtlar canlanmış... Bir boyutta kâğıtlar insanları notlandırıyordu. Burası ona benziyor.'], ['aykutcan', 'Güneydeki koridor sis dolu! Ben önden gideyim, sis bana işlemez!']]); } },
      { id: 'arena', x0: 30, y0: 1, x1: 38, y1: 22, fn() { bossIntro('tibet'); } },
    ],
    onStart() {
      if (G.flags.intro1) return; G.flags.intro1 = true;
      say([
        ['oguzhan', 'Burası... dilekçe kokuyor. Islak mürekkep ve iptal edilmiş tatiller.'],
        ['seyda', 'Şu kâğıtlara bakın! Canlanmışlar! Ödev Canavarları!'],
        ['aykutcan', 'Merak etmeyin, hepsini okuyup notlandırırız! Hem de gülerek!'],
      ]);
    },
  },
  { // ---------------------------------------------------------------- 2
    title: 'Çakabey Zindanı — 2. Kat: Kasvet Mağarası', theme: 'cave', floor: '.',
    build() {
      const g = grid(40, 24, '#');
      rect(g, 1, 17, 12, 22, '.'); rect(g, 5, 11, 7, 16, '.'); rect(g, 5, 13, 7, 13, 'K');
      rect(g, 1, 1, 16, 10, '.'); g[0][4] = 'L'; g[0][12] = 'L'; rect(g, 17, 4, 18, 6, 'G');
      rect(g, 19, 1, 30, 10, '.'); rect(g, 27, 1, 28, 10, 'F');
      rect(g, 32, 2, 37, 6, '.'); g[4][31] = 'C';
      rect(g, 24, 11, 26, 14, '.'); rect(g, 24, 12, 26, 13, '~');
      rect(g, 14, 15, 38, 22, '.');
      for (const [x, y] of [[9, 4], [2, 8], [14, 7], [22, 4], [20, 8], [21, 8]]) g[y][x] = 'K';
      for (const [x, y] of [[19, 18], [33, 18], [26, 20], [8, 20]]) g[y][x] = '#';
      rect(g, 15, 15, 16, 16, '~'); rect(g, 36, 15, 37, 16, '~');
      g[21][37] = 'X'; g[22][37] = 'X';
      if (G.flags.doorOpen) g[4][31] = '.';
      return g;
    },
    start: [3, 20],
    spawns: [['slime', 9, 19], ['slime', 3, 5], ['slime', 10, 7], ['slime', 14, 3], ['bat', 7, 3], ['bat', 13, 8],
      ['bat', 21, 3], ['bat', 25, 8], ['slime', 23, 6], ['bat', 30, 3],
      ['mertata', 29, 18, () => !G.flags.mert]],
    npcs: [['ekin', 35, 4]], items: [[2, 21], [15, 9], [29, 9], [35, 6], [15, 21], [37, 18]],
    obj: 'Kasvet Mağarası\'nı keşfet. Kristallere ve şalterlere dikkat!',
    exitOk: () => !!(G.flags.mert && G.flags.ekin),
    exitMsg: () => !G.flags.ekin ? 'Kapı kilitli: Ejderha Mührü gerekli! Yardım isteyen sesi bul.' : 'Mert Ata\'nın kasvet büyüsü merdiveni kapatıyor. Önce onu yen!',
    triggers: [
      { id: 'roomC', x0: 19, y0: 1, x1: 26, y1: 10, fn() { if (G.flags.t2c) return; G.flags.t2c = true; say([['ekin', '(uzaktan) Yardım edin! Biri duyuyor mu? Doğudaki hücredeyim!'], ['seyda', 'Bu Ekin Hocam\'ın sesi! Sisin arkasından geliyor!'], ['aykutcan', 'Sis mi? Benim için çocuk oyuncağı. Ben öndeyim!']]); setObj('Ekin\'i kurtar (doğudaki hücre). Sisi Aykutcan ile geç.'); } },
      { id: 'door', x0: 29, y0: 1, x1: 30, y1: 10, fn() { if (G.flags.t2d || G.flags.doorOpen) return; G.flags.t2d = true; say([['ekin', 'Hocalarım! Mert Ata beni lanetli bir kapıyla kilitledi!'], ['aykutcan', 'Merak etme Ekin Hocam! Lanetler benim neşeme dayanamaz! (E: Şifa Işığı)']]); setObj('Lanetli kapıyı Aykutcan\'ın Şifa Işığı ile aç (3, sonra E).'); } },
      { id: 'cell', x0: 32, y0: 2, x1: 37, y1: 6, fn() { if (G.flags.ekin || G.flags.t2e) return; G.flags.t2e = true; say([['ekin', 'Çok... halsizim. Kasvet bütün enerjimi emdi...'], ['aykutcan', 'Dayan Ekin Hocam, şifa geliyor!']]); setObj('Ekin\'i Aykutcan\'ın Şifa Işığı ile iyileştir.'); } },
      { id: 'arena', x0: 14, y0: 15, x1: 38, y1: 22, fn() { bossIntro('mertata'); } },
    ],
    onStart() {
      if (G.flags.intro2) return; G.flags.intro2 = true;
      say([
        ['seyda', 'Burası çok karanlık... Bu mor kristaller etrafa kötü enerji yayıyor.'],
        ['oguzhan', 'Kristalleşmiş kasvet. Bir boyutta bunlarla Plumbus cilalıyorlardı.'],
        ['seyda', 'Pembe büyüm bu kristalleri kırar! Ve yukarıdaki şalterler... tam bir zürafa işi!'],
      ]);
    },
  },
  { // ---------------------------------------------------------------- 3
    title: 'Ejderha İni — Çakabey\'in Kalbi', theme: 'lair', floor: '.',
    build() {
      const g = grid(30, 14, '#'); rect(g, 1, 1, 28, 12, '.');
      rect(g, 1, 1, 3, 2, '~'); rect(g, 26, 1, 28, 2, '~');
      for (const [x, y] of [[6, 5], [23, 5], [6, 10], [23, 10]]) g[y][x] = '#';
      return g;
    },
    start: [15, 11],
    spawns: [['dragon', 14.5, 3.1, () => !G.flags.dragon]],
    npcs: [['zeynep', 2, 11], ['ekin', 27, 11]], items: [[3, 7], [26, 7]],
    obj: 'Ejderhayı yen! Kalkan rengine göre öğretmen değiştir.',
    exitOk: () => false,
    onStart(retry) {
      const go = () => { const d = G.enemies.find(e => e.t === 'dragon'); if (d) { d.active = true; G.boss = d; sfx('roar'); G.shake = 0.8; } };
      if (G.flags.intro3) { go(); return; }
      G.flags.intro3 = true;
      say([
        ['dragon', 'KİM CESARET EDER... İNİME GİRMEYE...'],
        ['dragon', 'BEN BUNCAİŞİNARASINDAHAYATLARADOKUNMA! Dosyaların, formların, tutanakların efendisi!'],
        ['oguzhan', 'Vay. Adın bir cümle kadar uzun. Nüfus cüzdanın A3 mü?'],
        ['dragon', 'Her öğretmenin vaktini evraka gömeceğim! Kimse öğrencilerine dokunamayacak!'],
        ['aykutcan', 'İşte orada yanılıyorsun! Biz bunca işin arasında bile hayatlara dokunuruz!'],
        ['seyda', 'Hem de zürafalar kadar yüksekten ve sevgiyle!'],
        ['zeynep', 'Hocalarım, biz de buradayız! Ekin Hocam\'la size simit ve moral atacağız!'],
        ['ekin', 'Kalkanın rengine dikkat! MAVİ: Oğuzhan, PEMBE: Şeyda, ALTIN: Aykutcan!'],
      ], go);
    },
  },
];

// ---------------------------------------------------------------- game state
const G = {
  state: 'loading', mapIndex: 0, map: null, active: 'oguzhan', party: {}, cds: {},
  p: { x: 0, y: 0, hw: 13, hh: 9, fx: 1, fy: 0, flip: false, anim: 0, moving: false, inv: 0, fogT: 0 },
  enemies: [], projs: [], parts: [], texts: [], items: [], npcs: [], giraffes: [], fx: [], toasts: [], trail: [],
  flags: {}, mtrig: {}, hints: {}, cam: { x: 0, y: 0 }, shake: 0, time: 0, t: 0, dlg: null, boss: null, bubble: null, bubbleCd: 0,
  card: null, fade: null, obj: '', exitMsgT: 0, blockT: 0, hintT: 0, helperT: 8, paused: false, endT: 0,
  stats: { faints: 0, giraffes: 0, portals: 0, heals: 0, lasers: 0 },
};
window.__cz = { G, loadMap: i => loadMap(i), MAPS };

function resetParty() { for (const id of HERO_IDS) { G.party[id] = { hp: HERO[id].maxHp, down: false, sad: false }; G.cds[id] = { atk: 0, sp: 0 }; } }
function setObj(s) { G.obj = s; }
function toast(text, col = '#fff') { if (G.toasts.some(t => t.text === text)) return; G.toasts.push({ text, col, t: 5 }); if (G.toasts.length > 3) G.toasts.shift(); }
function floatText(x, y, text, col = '#fff', size = 16) { G.texts.push({ x, y, text, col, size, t: 1.1 }); }
function bubble(text, who) { G.bubble = { text, who: who || G.active, t: 3.2 }; }
function burst(x, y, col, n = 12, sp = 160, life = 0.6, size = 4, grav = 0) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: life * (0.6 + Math.random() * 0.6), max: life, col, size, grav }); }
}
function say(lines, cb) { G.dlg = { lines, i: 0, ch: 0, cb }; G.state = 'dialogue'; }

function tileAt(tx, ty) { const M = G.map; if (!M || ty < 0 || tx < 0 || ty >= M.h || tx >= M.w) return '#'; return M.g[ty][tx]; }
function tileAtPx(x, y) { return tileAt(Math.floor(x / TILE), Math.floor(y / TILE)); }
function setTile(tx, ty, ch) { G.map.g[ty][tx] = ch; }
const SOLID = new Set(['#', 'T', 'w', 'B', 'K', 'L', 'l', 'G', 'C']);
const PROJ_SOLID = new Set(['#', 'T', 'B', 'K', 'L', 'l', 'G', 'C']);
function blocks(ch, mode, c) {
  if (SOLID.has(ch)) return true;
  if (ch === '~') return mode !== 'flyer';
  if (ch === 'F') return mode === 'hero' && c && c.noFog;
  return false;
}
function collides(x, y, hw, hh, mode, c) {
  const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw - 0.01) / TILE), y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y + hh - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blocks(tileAt(tx, ty), mode, c)) return true;
  return false;
}
function moveActor(a, dx, dy, mode, c) {
  let hit = false;
  if (dx) { if (!collides(a.x + dx, a.y, a.hw, a.hh, mode, c)) a.x += dx; else hit = true; }
  if (dy) { if (!collides(a.x, a.y + dy, a.hw, a.hh, mode, c)) a.y += dy; else hit = true; }
  return hit;
}

// ---------------------------------------------------------------- map loading & static render
const THEMES = {
  outdoor: { floor: '#5aa349', floor2: '#4f9640', path: '#c8a46a', wall: '#6b6f7a', wallTop: '#8a8f9a', pit: '#15161c', bg: '#2d5a26' },
  dungeon: { floor: '#4e4c5c', floor2: '#47455a', path: '#4e4c5c', wall: '#25222f', wallTop: '#3d3850', pit: '#07060b', bg: '#120f18' },
  cave: { floor: '#3c3450', floor2: '#352d48', path: '#3c3450', wall: '#1a1426', wallTop: '#2e2342', pit: '#050309', bg: '#0b0812' },
  lair: { floor: '#4a2f2f', floor2: '#422828', path: '#4a2f2f', wall: '#241010', wallTop: '#3d1b1b', pit: '#0a0202', bg: '#120606' },
};
function renderStatic() {
  const M = G.map, th = THEMES[M.theme], c = M.layer.getContext('2d');
  const isWallish = ch => ch === '#' || ch === 'L' || ch === 'l';
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    const ch = M.g[y][x], px = x * TILE, py = y * TILE, r = hash(x, y);
    // zemin
    if (M.theme === 'outdoor') {
      c.fillStyle = r < 0.5 ? th.floor : th.floor2; c.fillRect(px, py, TILE, TILE);
      c.fillStyle = '#6fbf5a'; for (let i = 0; i < 4; i++) { const a = hash(x * 7 + i, y * 3); const b = hash(x * 3, y * 7 + i); c.fillRect(px + a * 44, py + b * 44, 2, 5); }
      if (ch === '.' || ch === 'X') { c.fillStyle = th.path; c.fillRect(px, py, TILE, TILE); c.fillStyle = '#b8935a'; for (let i = 0; i < 3; i++) c.fillRect(px + hash(x + i, y) * 40, py + hash(x, y + i) * 40, 6, 4); }
    } else {
      c.fillStyle = r < 0.5 ? th.floor : th.floor2; c.fillRect(px, py, TILE, TILE);
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
      if (r > 0.85) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(px + 8, py + 10, 14, 10); }
      if (M.theme === 'lair' && r > 0.7) { c.strokeStyle = 'rgba(255,90,30,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + 6, py + 30 * r); c.lineTo(px + 24, py + 20); c.lineTo(px + 40, py + 38 * r); c.stroke(); }
    }
    if (isWallish(ch)) {
      c.fillStyle = th.wall; c.fillRect(px, py, TILE, TILE);
      if (M.theme === 'outdoor') { c.fillStyle = th.wallTop; c.fillRect(px + 2, py + 2, TILE - 4, 10); }
      else {
        c.fillStyle = th.wallTop;
        for (let row = 0; row < 3; row++) for (let k = 0; k < 2; k++) { const off = row % 2 ? 12 : 0; c.fillRect(px + ((k * 24 + off) % 48) + 1, py + row * 16 + 1, 22, 14); }
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px, py + TILE - 6, TILE, 6);
      }
    }
    if (ch === 'T') {
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(px + 24, py + 42, 18, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#6b4423'; c.fillRect(px + 20, py + 26, 8, 18);
      c.fillStyle = '#1f5e24'; c.beginPath(); c.arc(px + 24, py + 20, 20, 0, 7); c.fill();
      c.fillStyle = '#2f7d33'; c.beginPath(); c.arc(px + 20, py + 16, 13, 0, 7); c.fill();
      c.fillStyle = '#4aa34e'; c.beginPath(); c.arc(px + 17, py + 12, 6, 0, 7); c.fill();
    }
    if (ch === 'w') {
      c.fillStyle = '#2f6fb5'; c.fillRect(px, py, TILE, TILE); c.fillStyle = '#5b9be0';
      c.fillRect(px + 6 + r * 10, py + 12, 14, 3); c.fillRect(px + 20, py + 30 - r * 8, 16, 3);
    }
    if (ch === '~') {
      c.fillStyle = th.pit; c.fillRect(px, py, TILE, TILE);
      const g2 = c.createLinearGradient(px, py, px, py + TILE); g2.addColorStop(0, 'rgba(255,255,255,0.06)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      if (tileAt(x, y - 1) !== '~') { c.fillStyle = M.theme === 'outdoor' ? '#5c4a36' : '#2a2535'; c.fillRect(px, py, TILE, 10); }
      c.fillStyle = g2; c.fillRect(px, py, TILE, TILE);
      if (M.theme !== 'outdoor' && r > 0.6) { c.fillStyle = 'rgba(160,90,255,0.25)'; c.fillRect(px + r * 30, py + 24, 3, 3); }
    }
    // duvar gölgesi
    if (!isWallish(ch) && ch !== '~' && ch !== 'T' && (isWallish(tileAt(x, y - 1)))) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px, py, TILE, 10); }
  }
}
function loadMap(i, retry) {
  const def = MAPS[i];
  if (!retry || !G.map || G.mapIndex !== i) {
    const g = def.build();
    G.map = { def, g, w: g[0].length, h: g.length, theme: def.theme, floor: def.floor };
  } else G.map.def = def;
  G.mapIndex = i;
  const M = G.map;
  M.layer = mk(M.w * TILE, M.h * TILE); renderStatic();
  G.enemies = []; G.projs = []; G.parts = []; G.texts = []; G.items = []; G.npcs = []; G.giraffes = []; G.fx = []; G.toasts = [];
  G.boss = null; G.mtrig = {}; G.bubble = null; G.helperT = 8;
  for (const [t, x, y, cond] of def.spawns) if (!cond || cond()) G.enemies.push(makeEnemy(t, x, y));
  for (const [id, x, y] of def.npcs) { const [px, py] = T(x, y); G.npcs.push({ id, x: px, y: py, state: id === 'ekin' && i === 2 && !G.flags.ekin ? 'hurt' : 'ok', alpha: 1, t: Math.random() * 3, chatT: 0 }); }
  for (const [x, y] of def.items) { const [px, py] = T(x, y); G.items.push({ x: px, y: py, t: Math.random() * 3 }); }
  const [sx, sy] = T(def.start[0], def.start[1]); G.p.x = sx; G.p.y = sy; G.p.inv = 1; G.p.fx = 1; G.p.fy = 0;
  G.trail = []; for (let k = 0; k < 60; k++) G.trail.push({ x: sx - (59 - k) * 2.4, y: sy, flip: false });
  resetParty();
  if (G.party[G.active].down) G.active = 'oguzhan';
  G.obj = def.obj; G.card = { text: def.title, t: 3.2 };
  G.state = 'play';
  def.onStart && def.onStart(retry);
}

// ---------------------------------------------------------------- enemies
function makeEnemy(t, tx, ty) {
  const [x, y] = T(tx, ty);
  const b = { t, x, y, hw: 13, hh: 9, kx: 0, ky: 0, flash: 0, tm: Math.random() * 3, dx: 0, dy: 0, wt: 0, alive: true };
  switch (t) {
    case 'slime': return Object.assign(b, { hp: 4, maxHp: 4, r: 18, speed: 62, dmg: 1 });
    case 'bat': return Object.assign(b, { hp: 3, maxHp: 3, r: 16, speed: 92, dmg: 1, flyer: true });
    case 'tibet': return Object.assign(b, { hp: 44, maxHp: 44, r: 24, speed: 80, dmg: 2, boss: true, active: false, name: 'Tibet — Baş Evrak Muhafızı',
      state: 'walk', st: 2, shield: 'blue', shT: 4.5, summoned: false });
    case 'mertata': return Object.assign(b, { hp: 52, maxHp: 52, r: 24, speed: 50, dmg: 2, boss: true, active: false, name: 'Mert Ata — Kasvetin Efendisi',
      shield: 'dark', shT: 5, tpT: 3.5, castT: 2, sumT: 8 });
    case 'dragon': return Object.assign(b, { hp: 150, maxHp: 150, r: 78, dmg: 2, boss: true, active: false, flyer: true, homeX: x, homeY: y,
      name: 'Buncaişinarasındahayatlaradokunma', shield: 'blue', shT: 9, atkT: 2.5, breathT: 0, breathW: 0, breathA: 0, fT: 0, sumT: 12 });
  }
}
function bossIntro(id) {
  const e = G.enemies.find(en => en.t === id); if (!e || e.active) return;
  const go = () => { e.active = true; G.boss = e; sfx('roar'); G.shake = 0.5; setObj(id === 'tibet' ? 'Tibet\'i yen! Mavi kalkan açıkken sadece Oğuzhan\'ın lazeri işler.' : 'Mert Ata\'yı yen! Mor kalkan açıkken sadece Şeyda hasar verir.'); };
  if (G.flags['bi_' + id]) { go(); return; }
  G.flags['bi_' + id] = true;
  if (id === 'tibet') say([
    ['tibet', 'Dur bakalım! Ben Tibet, Ejderha\'nın Baş Evrak Muhafızı!'],
    ['tibet', 'Buradan geçmek için 3 nüsha dilekçe, 2 vesikalık fotoğraf ve ıslak imza gerekiyor!'],
    ['oguzhan', 'Islak imza mı? Ben 47 boyut gezdim, bir boyutta imzalar insanları imzalıyordu. Korkmuyorum.'],
    ['tibet', 'Mavi Tekno-Evrak Kalkanım varken bana dokunamazsınız bile!'],
    ['seyda', 'Mavi kalkan... bu teknoloji! Oğuzhan Hocam, lazerinin tam sırası!'],
  ], go);
  else say([
    ['mertata', 'Hoş geldiniz... Ben Mert Ata, Kasvetin Efendisi!'],
    ['mertata', 'Bitmeyen toplantılarla beslenirim. "Bir dakika söz alabilir miyim?" diye başlayan her cümle beni güçlendirir!'],
    ['seyda', 'Kasvete karşı pembe büyü! Zürafalar, hazır olun!'],
    ['mertata', 'Mor Kasvet Kalkanımı sadece saf pozitif enerji delebilir... ki burada hiç yok, ha ha!'],
    ['oguzhan', 'Şeyda Hocam\'ın pembe büyüsü saf pozitif enerji. Bilimsel olarak kanıtladım. Az önce. Kafamda.'],
    ['aykutcan', 'Ve kasvet toplarına dikkat! Vurulan yavaşlar ama benim şifam hepsini düzeltir!'],
  ], go);
}
function eProj(x, y, ang, sp, kind, dmg = 1, r = 8, life = 3) { G.projs.push({ owner: 'enemy', kind, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r, dmg, life, rot: 0 }); }
function randomFloorNear(cx, cy, rad, minFromPlayer = 0) {
  for (let k = 0; k < 40; k++) {
    const x = cx + rand(-rad, rad), y = cy + rand(-rad, rad);
    if (!collides(x, y, 14, 10, 'enemy') && tileAtPx(x, y) !== 'F' && dist(x, y, G.p.x, G.p.y) >= minFromPlayer) return [x, y];
  }
  return [cx, cy];
}
function updateEnemies(dt) {
  const p = G.p;
  for (const e of G.enemies) {
    e.tm += dt; e.flash -= dt;
    const d = dist(e.x, e.y, p.x, p.y), ang = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.kx || e.ky) { moveActor(e, e.kx * dt, e.ky * dt, e.flyer ? 'flyer' : 'enemy'); e.kx *= 0.85; e.ky *= 0.85; if (Math.abs(e.kx) + Math.abs(e.ky) < 5) e.kx = e.ky = 0; }
    if (e.t === 'slime' || e.t === 'bat') {
      let vx = 0, vy = 0;
      if (d < (e.t === 'bat' ? 380 : 330)) { vx = Math.cos(ang); vy = Math.sin(ang); if (e.t === 'bat') { vx += Math.cos(e.tm * 3) * 0.6; vy += Math.sin(e.tm * 4) * 0.6; } }
      else { e.wt -= dt; if (e.wt <= 0) { e.wt = rand(1, 2.5); const a = rand(0, 6.28); e.dx = Math.random() < 0.3 ? 0 : Math.cos(a) * 0.5; e.dy = Math.random() < 0.3 ? 0 : Math.sin(a) * 0.5; } vx = e.dx; vy = e.dy; }
      moveActor(e, vx * e.speed * dt, vy * e.speed * dt, e.flyer ? 'flyer' : 'enemy');
    } else if (e.t === 'tibet' && e.active) {
      e.shT -= dt; if (e.shT <= 0) { e.shield = e.shield ? null : 'blue'; e.shT = e.shield ? 4.5 : 3.2; if (!e.shield) floatText(e.x, e.y - 70, 'KALKAN DÜŞTÜ!', '#fff'); }
      e.st -= dt;
      if (e.state === 'walk') { moveActor(e, Math.cos(ang) * e.speed * dt, Math.sin(ang) * e.speed * dt, 'enemy'); if (e.st <= 0) { e.state = 'wind'; e.st = 0.6; e.da = ang; } }
      else if (e.state === 'wind') { if (e.st <= 0) { e.state = 'dash'; e.st = 0.55; } }
      else if (e.state === 'dash') { const hit = moveActor(e, Math.cos(e.da) * 430 * dt, Math.sin(e.da) * 430 * dt, 'enemy'); if (Math.random() < 0.5) burst(e.x, e.y, '#f4f0e0', 1, 40, 0.4, 5); if (hit || e.st <= 0) { e.state = 'burst'; e.st = 0.4; } }
      else if (e.state === 'burst') { if (e.st <= 0) { const n = e.hp < e.maxHp / 2 ? 12 : 8; for (let k = 0; k < n; k++) eProj(e.x, e.y, k * 6.283 / n + e.tm, 190, 'paper'); sfx('hit'); e.state = 'walk'; e.st = rand(1.6, 2.6); } }
      if (!e.summoned && e.hp < e.maxHp / 2) { e.summoned = true; for (let k = 0; k < 2; k++) { const s = makeEnemy('slime', 0, 0); [s.x, s.y] = randomFloorNear(e.x, e.y, 120); G.enemies.push(s); burst(s.x, s.y, '#fff', 10); } floatText(e.x, e.y - 70, 'EK EVRAK!', '#ff6a6a', 18); }
    } else if (e.t === 'mertata' && e.active) {
      e.shT -= dt; if (e.shT <= 0) { e.shield = e.shield ? null : 'dark'; e.shT = e.shield ? 5 : 3; if (!e.shield) floatText(e.x, e.y - 70, 'KALKAN DÜŞTÜ!', '#fff'); }
      moveActor(e, Math.cos(e.tm) * 30 * dt, Math.sin(e.tm * 1.3) * 30 * dt, 'enemy');
      e.tpT -= dt; if (e.tpT <= 0) { e.tpT = rand(3.5, 5); burst(e.x, e.y - 30, '#a35cff', 20, 200); const [nx, ny] = randomFloorNear(26 * TILE, 19 * TILE, 9 * TILE, 200); e.x = nx; e.y = ny; burst(e.x, e.y - 30, '#a35cff', 20, 200); sfx('portal'); }
      e.castT -= dt; if (e.castT <= 0) { e.castT = e.hp < e.maxHp / 2 ? 1.6 : 2.3; for (let k = -1; k <= 1; k++) eProj(e.x, e.y, ang + k * 0.3, 150, 'dark', 1, 10, 4); }
      e.sumT -= dt; if (e.sumT <= 0) { e.sumT = 9; if (G.enemies.length < 6) for (let k = 0; k < 2; k++) { const s = makeEnemy('bat', 0, 0); s.x = e.x + rand(-60, 60); s.y = e.y + rand(-60, 60); G.enemies.push(s); } floatText(e.x, e.y - 70, 'Bir gündem maddesi daha!', '#b78cff'); }
    } else if (e.t === 'dragon' && e.active) {
      const rage = e.hp < e.maxHp * 0.5;
      e.x = e.homeX + Math.sin(e.tm * 0.45) * 170; e.y = e.homeY + Math.sin(e.tm * 0.9) * 24;
      e.shT -= dt; if (e.shT <= 0) { e.shield = pick(['blue', 'pink', 'gold'].filter(s => s !== e.shield)); e.shT = rage ? 7 : 9; toast('Kalkan değişti: ' + SHIELD_TXT[e.shield], SHIELD_COL[e.shield]); burst(e.x, e.y, SHIELD_COL[e.shield], 30, 260); sfx('block'); }
      const hx = e.x, hy = e.y + 85, ha = Math.atan2(p.y - hy, p.x - hx);
      if (e.breathW > 0) { e.breathW -= dt; if (e.breathW <= 0) { e.breathT = rage ? 1.8 : 1.4; e.breathA = ha; } }
      else if (e.breathT > 0) { e.breathT -= dt; e.fT -= dt; e.breathA += clamp(((ha - e.breathA + 9.42) % 6.283) - 3.14, -1, 1) * dt * 0.8; if (e.fT <= 0) { e.fT = 0.05; eProj(hx, hy, e.breathA + rand(-0.22, 0.22), rand(230, 290), 'fire', 1, 10, 1.6); } }
      else {
        e.atkT -= dt;
        if (e.atkT <= 0) {
          const opts = ['volley', 'volley', 'breath']; if (rage) opts.push('ring', 'ring'); const a = pick(opts);
          if (a === 'volley') { const n = rage ? 5 : 3; for (let k = 0; k < n; k++) eProj(hx, hy, ha + (k - (n - 1) / 2) * 0.22, 220, 'fire', 1, 11); e.atkT = rage ? 1.6 : 2.2; sfx('hit'); }
          else if (a === 'breath') { e.breathW = 0.9; e.atkT = 3.2; floatText(e.x, e.y + 120, 'NEFES!', '#ff9a2e', 20); sfx('roar'); }
          else { for (let k = 0; k < 16; k++) eProj(e.x, e.y, k * 6.283 / 16 + e.tm, 170, 'fire', 1, 10); e.atkT = 2.4; }
        }
      }
      e.sumT -= dt; if (e.sumT <= 0) { e.sumT = rage ? 10 : 13; if (G.enemies.length < 5) { for (let k = 0; k < 2; k++) { const s = makeEnemy('slime', 0, 0); [s.x, s.y] = randomFloorNear(e.x, e.y + 190, 130); G.enemies.push(s); burst(s.x, s.y, '#fff', 8); } floatText(e.x, e.y - 90, 'YENİ FORMLAR!', '#ff9a3c', 18); } }
    }
    // temas hasarı
    if ((!e.boss || e.active) && d < e.r + 14 && !(e.t === 'dragon' && false)) hurtHero(e.dmg);
  }
  G.enemies = G.enemies.filter(e => e.alive);
}
function heroHit(e, dmg, hero, kx = 0, ky = 0) {
  if (!e.alive) return false;
  if (e.boss && !e.active) return false;
  if (e.shield && SHIELD_NEED[e.shield] !== hero) {
    if (!e.blockT || G.t - e.blockT > 0.4) { e.blockT = G.t; floatText(e.x, e.y - (e.t === 'dragon' ? 130 : 60), 'ETKİSİZ! (' + HERO[SHIELD_NEED[e.shield]].name + ' lazım)', '#bbb', 14); sfx('block'); }
    return true;
  }
  e.hp -= dmg; e.flash = 0.12; sfx('hit');
  floatText(e.x + rand(-10, 10), e.y - (e.t === 'dragon' ? 110 : 50), '-' + dmg, HERO[hero].col);
  if (!e.boss) { e.kx = kx; e.ky = ky; }
  if (e.hp <= 0) killEnemy(e);
  return true;
}
function killEnemy(e) {
  e.alive = false;
  burst(e.x, e.y - 20, e.t === 'bat' ? '#7b3fb0' : '#f4f0e0', 16, 200);
  if (!e.boss && Math.random() < 0.18) G.items.push({ x: e.x, y: e.y, t: 0 });
  if (e.boss) onBossDefeated(e);
}
function onBossDefeated(e) {
  G.boss = null; G.projs = G.projs.filter(p => p.owner !== 'enemy'); sfx('win'); G.shake = 0.6;
  for (const en of G.enemies) if (en !== e) { en.alive = false; burst(en.x, en.y - 20, '#fff', 8); }
  if (e.t === 'tibet') {
    G.flags.tibet = true;
    const n = { id: 'tibet', x: e.x, y: e.y, state: 'ok', alpha: 1, t: 0, chatT: 0 }; G.npcs.push(n);
    say([
      ['tibet', 'Ahh! Dosyalarım! Alfabetik sıralamam bozuldu!'],
      ['tibet', 'Tamam, tamam... Kabul ediyorum. Ejderha bize her gün "bir form daha" dedi. Ben de çok yoruldum.'],
      ['aykutcan', 'Gel buraya Tibet, bir sarılayım! Kimse evrak doldurmak için doğmadı!'],
      ['tibet', '...Bu sıcaklık ne? Unutmuştum bu hissi. Aşağıda Mert Ata var, ondan dikkatli olun!'],
      ['oguzhan', 'Bir kötü adam daha iyi tarafa geçti. Bu boyutta işler güzel gidiyor. Wubba lubba dub dub!'],
    ], () => { n.leaving = true; setObj('Kuzeydeki merdivenlerden 2. kata in.'); toast('Merdivenin mührü kırıldı!', '#7dff8a'); });
  } else if (e.t === 'mertata') {
    G.flags.mert = true;
    const n = { id: 'mertata', x: e.x, y: e.y, state: 'ok', alpha: 1, t: 0, chatT: 0 }; G.npcs.push(n);
    say([
      ['mertata', 'Hayır... kasvetim... dağılıyor...'],
      ['mertata', 'Aslında ben sadece toplantıların kısa sürmesini istiyordum. Ejderha bana sürekli "gündeme madde ekle" dedi.'],
      ['seyda', 'Al, bu peluş zürafa senin olsun. Uzun boynuyla her şeye yukarıdan bakmayı öğretir.'],
      ['mertata', '...Teşekkürler. Ejderhanın ini aşağıda. Ama Ejderha Mührü olmadan merdiven açılmaz.'],
    ], () => { n.leaving = true; setObj(G.flags.ekin ? 'Güneydoğudaki merdivenden Ejderha İni\'ne in!' : 'Ejderha Mührü için Ekin\'i kurtar (kuzeydoğu).'); if (G.flags.ekin) toast('Merdiven açıldı!', '#7dff8a'); });
  } else if (e.t === 'dragon') {
    G.flags.dragon = true;
    const n = { id: 'dragonling', x: e.x, y: e.y + 40, state: 'ok', alpha: 1, t: 0, chatT: 0 }; G.npcs.push(n);
    burst(e.x, e.y, '#ffd34d', 60, 380, 1.2, 6); burst(e.x, e.y, '#f4f0e0', 60, 300, 1.5, 7);
    const [tx, ty] = T(9, 8), [mx, my] = T(21, 8);
    G.npcs.push({ id: 'tibet', x: tx, y: ty, state: 'ok', alpha: 1, t: 0, chatT: 0 }, { id: 'mertata', x: mx, y: my, state: 'ok', alpha: 1, t: 0, chatT: 0 });
    say([
      ['dragon', 'Ahhh... Kalkanlarım... dağılıyor... Evraklar uçup gidiyor...'],
      ['narrator', 'Devasa ejderha küçülür, küçülür... ve ortada sevimli, minik bir ejderha kalır.'],
      ['dragon', 'Ben... aslında bir öğretmen ejderhasıydım. Yıllar önce. Ama formlar, raporlar, tutanaklar üstüme yığıldıkça büyüdüm ve öfkelendim.'],
      ['dragon', 'Adımın anlamını bile unuttum: Bunca işin arasında hayatlara dokunma... Bu bir yasak değil, bir hatırlatmaymış!'],
      ['aykutcan', 'Aynen öyle dostum! Bunca işin arasında hayatlara dokunmak — işte öğretmenlik bu!'],
      ['seyda', 'Gel bizimle! Zürafalarımla tanışırsın, sana okul bahçesini gezdiririz.'],
      ['oguzhan', 'Ve böylece bir boyutta bir macera daha biter. Wubba lubba dub dub! ...Bu sefer mutluluktan.'],
      ['tibet', 'Biz de yardım edebilir miyiz? Bütün evrakları dijitalleştirebilirim!'],
      ['mertata', 'Ben de toplantıları 15 dakikaya indiririm. Söz!'],
      ['zeynep', 'Hocalarım, başardınız! Çakabey\'e neşe geri döndü!'],
      ['ekin', 'Yarın ders var ama... bu akşam çay ve simit benden!'],
    ], () => { G.fade = { t: 0, dir: 1, cb: () => { G.state = 'ending'; G.endT = 0; sfx('win'); } }; });
  }
}

// ---------------------------------------------------------------- heroes
function aim() { const l = Math.hypot(G.p.fx, G.p.fy) || 1; return [G.p.fx / l, G.p.fy / l]; }
function dir4() { const { fx, fy } = G.p; return Math.abs(fx) >= Math.abs(fy) ? [Math.sign(fx) || 1, 0] : [0, Math.sign(fy)]; }
function hurtHero(dmg, isFog) {
  const p = G.p; if (G.state !== 'play') return;
  if (!isFog && p.inv > 0) return;
  const h = G.party[G.active]; h.hp -= dmg; sfx('hurt'); G.shake = Math.max(G.shake, 0.2);
  floatText(p.x, p.y - 80, '-' + dmg, '#ff5050', 18);
  if (!isFog) p.inv = 1.0;
  if (h.hp <= 0) {
    h.hp = 0; h.down = true; h.sad = false; G.stats.faints++; sfx('die'); burst(p.x, p.y - 30, HERO[G.active].col, 24, 220);
    const next = HERO_IDS.find(id => !G.party[id].down);
    if (!next) { G.state = 'gameover'; G.endT = 0; return; }
    toast(HERO[G.active].name + ' bayıldı! ' + (next !== 'aykutcan' && !G.party.aykutcan.down ? 'Aykutcan\'ın Şifa Işığı canlandırır.' : ''), '#ff8080');
    G.active = next; p.inv = 1.5; bubble(next === 'aykutcan' ? 'Merak etme, seni hemen kaldıracağım!' : 'Dayan, devralıyorum!');
  }
}
function switchTo(id) {
  if (id === G.active) return;
  if (G.party[id].down) { toast(HERO[id].name + ' baygın! Aykutcan\'ın Şifa Işığı (E) ya da simit canlandırır.', '#ff8080'); sfx('block'); return; }
  if (tileAtPx(G.p.x, G.p.y) === 'F' && id !== 'aykutcan') { toast('Sisin içindeyken sadece Aykutcan dayanabilir!', '#c9b8ff'); sfx('block'); return; }
  G.active = id; sfx('sw'); burst(G.p.x, G.p.y - 36, HERO[id].col, 14, 120);
  if (id === 'oguzhan' || Math.random() < 0.5) bubble(pick(QUOTES[id]));
}
function attack(id) {
  const p = G.p, [ax, ay] = aim(), cd = G.cds[id]; cd.atk = HERO[id].atkCd;
  if (id === 'oguzhan') { G.projs.push({ owner: 'hero', hero: id, kind: 'laser', x: p.x + ax * 18, y: p.y + ay * 10, vx: ax * 640, vy: ay * 640, r: 7, dmg: 2, life: 0.8 }); sfx('laser'); G.stats.lasers++; }
  else if (id === 'seyda') { G.projs.push({ owner: 'hero', hero: id, kind: 'heart', x: p.x + ax * 18, y: p.y + ay * 10, vx: ax * 430, vy: ay * 430, r: 10, dmg: 2, life: 1.0 }); sfx('heart'); }
  else {
    const cx = p.x + ax * 34, cy = p.y + ay * 34; sfx('melee');
    G.fx.push({ kind: 'wave', x: cx, y: cy, t: 0.3, max: 0.3, col: '#ffd34d', r: 64 });
    for (let k = 0; k < 8; k++) G.parts.push({ x: cx, y: cy - 20, vx: rand(-120, 120), vy: rand(-160, 40), t: 0.6, max: 0.6, col: pick(['#ffd34d', '#fff2a8', '#ff9f43']), size: 5, grav: 200, star: true });
    for (const e of G.enemies) if (dist(cx, cy, e.x, e.y) < 62 + e.r) heroHit(e, 3, 'aykutcan', ax * 280, ay * 280);
  }
}
function special(id) {
  const p = G.p, cd = G.cds[id];
  if (id === 'oguzhan') {
    const [dx, dy] = dir4(), tx0 = Math.floor(p.x / TILE), ty0 = Math.floor(p.y / TILE);
    let crossed = false, dest = null, lastFree = null;
    for (let d = 1; d <= 6; d++) {
      const tx = tx0 + dx * d, ty = ty0 + dy * d, ch = tileAt(tx, ty);
      if (ch === '~' || ch === 'w') { crossed = true; continue; }
      if (ch === 'F' || blocks(ch, 'hero', { noFog: true })) break;
      if (crossed) { dest = [tx, ty]; break; }
      lastFree = [tx, ty]; if (d >= 3) break;
    }
    if (!dest) dest = lastFree;
    if (!dest) { bubble('Portal için yer yok! Önüm kapalı.'); sfx('block'); cd.sp = 0.3; return; }
    cd.sp = HERO.oguzhan.spCd; G.stats.portals++;
    G.fx.push({ kind: 'portal', x: p.x, y: p.y - 30, t: 0.6, max: 0.6 });
    p.x = dest[0] * TILE + TILE / 2; p.y = dest[1] * TILE + TILE / 2;
    G.fx.push({ kind: 'portal', x: p.x, y: p.y - 30, t: 0.6, max: 0.6 });
    for (const tr of G.trail) { tr.x = p.x; tr.y = p.y; }
    burst(p.x, p.y - 30, '#7dff6a', 20, 180); sfx('portal'); p.inv = Math.max(p.inv, 0.4);
    if (crossed && Math.random() < 0.6) bubble(pick(QUOTES.oguzhan));
  } else if (id === 'seyda') {
    const [dx, dy] = dir4(); cd.sp = HERO.seyda.spCd; G.stats.giraffes++;
    G.giraffes.push({ x: p.x + dx * 10, y: p.y + dy * 10, hw: 12, hh: 9, dx, dy, t: 2.4, hit: new Set(), anim: 0, flip: dx < 0 || (dx === 0 && p.flip) });
    sfx('giraffe'); burst(p.x, p.y - 30, '#ff6fcf', 16, 150);
    if (Math.random() < 0.5) bubble(pick(QUOTES.seyda));
  } else {
    cd.sp = HERO.aykutcan.spCd; G.stats.heals++; sfx('heal');
    for (const h of HERO_IDS) { const s = G.party[h]; if (s.down) { s.down = false; s.hp = Math.ceil(HERO[h].maxHp / 2); toast(HERO[h].name + ' canlandı!', '#7dff8a'); } else s.hp = Math.min(HERO[h].maxHp, s.hp + 5); s.sad = false; }
    G.fx.push({ kind: 'heal', x: p.x, y: p.y - 20, t: 0.8, max: 0.8 });
    for (let k = 0; k < 16; k++) G.parts.push({ x: p.x + rand(-40, 40), y: p.y - rand(0, 60), vx: 0, vy: -rand(40, 90), t: 1, max: 1, col: '#7dff8a', size: 5, plus: true });
    const tx0 = Math.floor(p.x / TILE), ty0 = Math.floor(p.y / TILE);
    for (let y = ty0 - 3; y <= ty0 + 3; y++) for (let x = tx0 - 3; x <= tx0 + 3; x++) if (tileAt(x, y) === 'C') {
      setTile(x, y, G.map.floor); burst(x * TILE + 24, y * TILE + 24, '#a35cff', 30, 220); burst(x * TILE + 24, y * TILE + 24, '#7dff8a', 20, 160);
      sfx('open'); toast('Lanet çözüldü! Kapı açıldı.', '#7dff8a'); G.flags.doorOpen = true; bubble('Lanet mi? Benim neşem daha güçlü!');
    }
    const ek = G.npcs.find(n => n.id === 'ekin' && n.state === 'hurt');
    if (ek && dist(ek.x, ek.y, p.x, p.y) < 190) {
      ek.state = 'ok'; G.flags.ekin = true; burst(ek.x, ek.y - 30, '#7dff8a', 30, 200);
      say([
        ['ekin', 'Ohh... Aykutcan Hocam\'ın şifası gerçekten mucize! Yorgunluğum geçti!'],
        ['ekin', 'Alın bunu: Ejderha Mührü! Ejderhanın inine inen merdiveni ancak bu açar.'],
        ['seyda', 'Teşekkürler Ekin Hocam! Bir zürafa çıkartması ister misin?'],
        ['ekin', 'Kesinlikle! Ben de son savaşta size destek olacağım. Önce Mert Ata\'yı halledin — güneydeki büyük salonda.'],
      ], () => { setObj(G.flags.mert ? 'Güneydoğudaki merdivenden Ejderha İni\'ne in!' : 'Mert Ata\'yı yen (güneydeki salon). Uçurumu Oğuzhan\'ın portalıyla geç.'); toast('Ejderha Mührü alındı!', '#ffd34d'); });
    } else if (Math.random() < 0.5) bubble(pick(QUOTES.aykutcan));
  }
}
function checkGates() {
  const M = G.map; let left = 0;
  for (const row of M.g) for (const ch of row) if (ch === 'L') left++;
  if (left > 0) { toast('Şalter indi! (' + left + ' şalter daha)', '#ffd34d'); return; }
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (M.g[y][x] === 'G') { M.g[y][x] = M.floor; burst(x * TILE + 24, y * TILE + 24, '#cfcfcf', 10, 150); }
  sfx('open'); toast('Bütün şalterler indi — kapı açıldı!', '#7dff8a');
  setTimeout(() => bubble('Aferin benim uzun boylu dostum!', 'seyda'), 300);
}
function updateGiraffes(dt) {
  for (const g of G.giraffes) {
    g.t -= dt; g.anim += dt;
    const hit = moveActor(g, g.dx * 380 * dt, g.dy * 380 * dt, 'enemy');
    if (Math.random() < 0.4) G.parts.push({ x: g.x, y: g.y - 10, vx: rand(-20, 20), vy: -30, t: 0.5, max: 0.5, col: '#ff9fe0', size: 4, heart: true });
    for (const e of G.enemies) if (!g.hit.has(e) && dist(g.x, g.y, e.x, e.y) < e.r + 26) { g.hit.add(e); heroHit(e, 4, 'seyda', g.dx * 300, g.dy * 300); }
    if (hit) {
      // önündeki karoları kontrol et (dik yönde ±1 tolerans)
      const tx = Math.floor((g.x + g.dx * 30) / TILE), ty = Math.floor((g.y + g.dy * 30) / TILE);
      for (let k = -1; k <= 1; k++) {
        const x = tx + (g.dy ? k : 0), y = ty + (g.dx ? k : 0), ch = tileAt(x, y);
        if (ch === 'L') { setTile(x, y, 'l'); sfx('lever'); burst(x * TILE + 24, y * TILE + 24, '#ffd34d', 20, 200); renderStatic(); checkGates(); break; }
        if (ch === 'K' && k === 0) { breakTile(x, y, '#a35cff'); break; }
      }
      g.t = 0;
    }
    if (g.t <= 0) { g.dead = true; burst(g.x, g.y - 30, '#ff6fcf', 14, 160); }
  }
  G.giraffes = G.giraffes.filter(g => !g.dead);
}
function breakTile(x, y, col) { setTile(x, y, G.map.floor); burst(x * TILE + 24, y * TILE + 24, col, 24, 240, 0.7, 5); sfx('brk'); G.shake = Math.max(G.shake, 0.15); }

function updateProjs(dt) {
  const p = G.p;
  for (const b of G.projs) {
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot = (b.rot || 0) + dt * 8;
    if (b.kind === 'dark') { const a = Math.atan2(p.y - b.y, p.x - b.x), sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx); const na = cur + clamp(((a - cur + 9.42) % 6.283) - 3.14, -1.2 * dt, 1.2 * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
    const tx = Math.floor(b.x / TILE), ty = Math.floor(b.y / TILE), ch = tileAt(tx, ty);
    if (PROJ_SOLID.has(ch)) {
      if (b.owner === 'hero' && b.kind === 'laser' && ch === 'B') { breakTile(tx, ty, '#4fc3ff'); toast('Bariyer kırıldı!', '#4fc3ff'); }
      else if (b.owner === 'hero' && b.kind === 'heart' && ch === 'K') breakTile(tx, ty, '#ff6fcf');
      else if (b.owner === 'hero' && ch === 'B' && G.blockT <= 0) { bubble('Bu bariyer teknolojik... Oğuzhan\'ın lazeri lazım (1).'); G.blockT = 3; }
      else if (b.owner === 'hero' && ch === 'K' && G.blockT <= 0) { bubble('Karanlık kristal! Şeyda\'nın pembe büyüsü kırar (2).'); G.blockT = 3; }
      b.life = 0; burst(b.x, b.y - 24, b.kind === 'laser' ? '#4fc3ff' : b.kind === 'heart' ? '#ff6fcf' : '#ffb347', 5, 90, 0.3);
      continue;
    }
    if (b.owner === 'hero') {
      for (const e of G.enemies) if (e.alive && dist(b.x, b.y, e.x, e.y) < b.r + e.r) { heroHit(e, b.dmg, b.hero, b.vx * 0.4, b.vy * 0.4); b.life = 0; burst(b.x, b.y - 24, b.kind === 'laser' ? '#4fc3ff' : '#ff6fcf', 6, 120, 0.3); break; }
    } else if (dist(b.x, b.y, p.x, p.y) < b.r + 12 && G.state === 'play') {
      if (p.inv <= 0) {
        hurtHero(b.dmg);
        if (b.kind === 'dark' && G.active !== 'aykutcan' && G.party[G.active] && !G.party[G.active].down) { G.party[G.active].sad = true; toast(HERO[G.active].name + ' kasvetlendi (yavaş)! Aykutcan\'ın şifası düzeltir.', '#b78cff'); }
      }
      b.life = 0;
    }
  }
  G.projs = G.projs.filter(b => b.life > 0);
}

// ---------------------------------------------------------------- hints
const HINTS = [
  { ch: '~', r: 3, id: 'pit', txt: 'UÇURUM! Oğuzhan\'a geç (1) ve uçuruma dönüp E ile portal atla.' },
  { ch: 'B', r: 3, id: 'bar', txt: 'ENERJİ BARİYERİ! Sadece Oğuzhan\'ın lazeri (1, SPACE) kırabilir.' },
  { ch: 'F', r: 2, id: 'fog', txt: 'KASVET SİSİ! Sadece hep neşeli Aykutcan (3) içinden geçebilir.' },
  { ch: 'L', r: 9, id: 'lev', txt: 'YÜKSEK ŞALTER (sarı ünlem)! Şeyda (2) ile şaltere dön ve E ile zürafa çağır.' },
  { ch: 'K', r: 3, id: 'cry', txt: 'KARANLIK KRİSTAL! Sadece Şeyda\'nın pembe büyüsü (2, SPACE) kırar.' },
  { ch: 'C', r: 4, id: 'cur', txt: 'LANETLİ KAPI! Aykutcan\'ın Şifa Işığı (3, E) laneti çözer.' },
];
function updateHints(dt) {
  G.hintT -= dt; if (G.hintT > 0) return; G.hintT = 0.3;
  const tx0 = Math.floor(G.p.x / TILE), ty0 = Math.floor(G.p.y / TILE);
  for (const h of HINTS) {
    if (G.hints[h.id]) continue;
    let found = false;
    for (let y = ty0 - h.r; y <= ty0 + h.r && !found; y++) for (let x = tx0 - h.r; x <= tx0 + h.r; x++) if (tileAt(x, y) === h.ch) { found = true; break; }
    if (found) { G.hints[h.id] = true; toast('İPUCU: ' + h.txt, '#ffe08a'); }
  }
}
const BLOCK_LINES = {
  '~': { oguzhan: 'Uçurum! E ile portal açayım!', other: 'Uçurum! Oğuzhan\'ın portalı lazım (1, sonra E).' },
  'F': { oguzhan: 'Bu sis beni bile kasvetlendirir. Aykutcan\'a geçelim (3)!', other: 'Kasvet sisi! Sadece Aykutcan geçebilir (3).' },
  'B': { oguzhan: 'Lazerle (SPACE) kıralım şunu!', other: 'Enerji bariyeri! Oğuzhan\'ın lazeri lazım (1).' },
  'K': { seyda: 'Pembe büyüyle (SPACE) kırarım!', other: 'Karanlık kristal! Şeyda\'nın büyüsü lazım (2).' },
  'G': { other: 'Kapı kilitli. Bir yerde yüksek bir şalter olmalı... Şeyda\'nın zürafası yetişir!' },
  'C': { aykutcan: 'Lanetli kapı! Şifa Işığı (E) ile çözerim!', other: 'Lanetli kapı! Aykutcan\'ın Şifa Işığı lazım (3).' },
  'w': { oguzhan: 'Su! Portalla (E) üstünden atlayabilirim.', other: 'Su... Islanmayalım.' },
};

// ---------------------------------------------------------------- update
function updatePlay(dt) {
  const p = G.p, id = G.active, ph = G.party[id];
  G.time += dt;
  let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const moving = !!(mx || my);
  if (moving) { const l = Math.hypot(mx, my); mx /= l; my /= l; p.fx = mx; p.fy = my; if (mx) p.flip = mx < 0; }
  const sp = 195 * (ph.sad ? 0.6 : 1);
  const inFog = tileAtPx(p.x, p.y) === 'F';
  const ox = p.x, oy = p.y;
  moveActor(p, mx * sp * dt, my * sp * dt, 'hero', { noFog: id !== 'aykutcan' && !inFog });
  p.moving = moving && (Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.1);
  if (p.moving) { p.anim += dt; G.trail.push({ x: p.x, y: p.y, flip: p.flip }); if (G.trail.length > 60) G.trail.shift(); }
  // engel konuşması
  G.blockT -= dt;
  if (moving && !p.moving && G.blockT <= 0) {
    const ch = tileAtPx(p.x + mx * 30, p.y + my * 30), bl = BLOCK_LINES[ch];
    if (bl) { const line = bl[id] || bl.other; if (line && !(ch === 'F' && id === 'aykutcan')) { bubble(line); G.blockT = 3.5; } }
  }
  if (inFog && id !== 'aykutcan') { p.fogT -= dt; if (p.fogT <= 0) { p.fogT = 0.45; hurtHero(1, true); } }
  p.inv -= dt;
  for (const h of HERO_IDS) { const c = G.cds[h]; c.atk = Math.max(0, c.atk - dt); c.sp = Math.max(0, c.sp - dt); }
  if (G.state !== 'play') return;
  if (pressed.h1) switchTo('oguzhan'); if (pressed.h2) switchTo('seyda'); if (pressed.h3) switchTo('aykutcan');
  if (pressed.next) { const i = HERO_IDS.indexOf(G.active); for (let k = 1; k < 3; k++) { const n = HERO_IDS[(i + k) % 3]; if (!G.party[n].down) { switchTo(n); break; } } }
  if (pressed.atk && G.cds[G.active].atk <= 0) attack(G.active);
  if (pressed.sp && G.cds[G.active].sp <= 0) special(G.active);
  if (G.state !== 'play') return;
  // eşyalar
  for (const it of G.items) {
    it.t += dt;
    if (it.fly) { it.ft += dt; if (it.ft >= it.fdur) it.fly = false; continue; }
    if (dist(it.x, it.y, p.x, p.y) < 30) {
      const a = G.party[G.active]; let msg;
      if (a.hp < HERO[G.active].maxHp) { a.hp = Math.min(HERO[G.active].maxHp, a.hp + 4); msg = '+4 can'; }
      else { const dn = HERO_IDS.find(h => G.party[h].down); if (dn) { G.party[dn].down = false; G.party[dn].hp = 4; msg = HERO[dn].name + ' canlandı!'; } else { const lo = HERO_IDS.reduce((m, h) => G.party[h].hp / HERO[h].maxHp < G.party[m].hp / HERO[m].maxHp ? h : m, G.active); G.party[lo].hp = Math.min(HERO[lo].maxHp, G.party[lo].hp + 4); msg = HERO[lo].name + ' +4'; } }
      it.dead = true; sfx('pickup'); floatText(it.x, it.y - 40, 'Simit! ' + msg, '#ffd28a'); burst(it.x, it.y - 12, '#d08a4a', 10, 120);
    }
  }
  G.items = G.items.filter(i => !i.dead);
  updateEnemies(dt); updateGiraffes(dt); updateProjs(dt); updateHints(dt);
  // NPC'ler
  for (const n of G.npcs) {
    n.t += dt; if (n.leaving) { n.alpha -= dt * 0.6; if (n.alpha <= 0) n.dead = true; }
    n.chatT -= dt;
    if (n.chatT <= 0 && dist(n.x, n.y, p.x, p.y) < 110 && G.state === 'play' && !n.leaving) {
      n.chatT = 5; const L = { zeynep: ['Bol şans hocalarım!', 'Simitler benden!', 'Başarabilirsiniz!'], ekin: n.state === 'hurt' ? ['Yardım... edin...', 'Çok halsizim...'] : ['Teşekkürler hocalarım!', 'Ejderhanın kalkan rengine dikkat!'], tibet: ['Dilekçeler dijital olacak!'], mertata: ['Toplantı 15 dakika, söz!'], dragonling: ['Teşekkürler!'] }[n.id];
      if (L) n.say = { text: pick(L), t: 2.5 };
    }
    if (n.say) { n.say.t -= dt; if (n.say.t <= 0) n.say = null; }
  }
  G.npcs = G.npcs.filter(n => !n.dead);
  // ejderha savaşında yardımcılar simit fırlatır
  if (G.boss && G.boss.t === 'dragon') {
    G.helperT -= dt;
    if (G.helperT <= 0) {
      G.helperT = 12; const thrower = pick(G.npcs.filter(n => n.id === 'zeynep' || n.id === 'ekin'));
      if (thrower) { const [x, y] = randomFloorNear(p.x, p.y, 110); G.items.push({ x, y, t: 0, fly: true, ft: 0, fdur: 0.9, sx: thrower.x, sy: thrower.y }); thrower.say = { text: pick(['Simit geliyor!', 'Yakala hocam!', 'Moral simidi!']), t: 2 }; }
    }
  }
  // tetikleyiciler
  const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
  for (const tr of (G.map.def.triggers || [])) if (!G.mtrig[tr.id] && tx >= tr.x0 && tx <= tr.x1 && ty >= tr.y0 && ty <= tr.y1) { G.mtrig[tr.id] = true; tr.fn(); if (G.state !== 'play') return; }
  // çıkış
  G.exitMsgT -= dt;
  if (tileAt(tx, ty) === 'X') {
    if (G.map.def.exitOk()) { if (!G.fade) { sfx('open'); const ni = G.mapIndex + 1; G.fade = { t: 0, dir: 1, cb: () => loadMap(ni) }; } }
    else if (G.exitMsgT <= 0) { toast(G.map.def.exitMsg(), '#ff9a9a'); G.exitMsgT = 3; }
  }
  if (G.bubble) { G.bubble.t -= dt; if (G.bubble.t <= 0) G.bubble = null; }
}
function updateCommon(dt) {
  for (const q of G.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.grav || 0) * dt; q.vx *= 0.97; if (!q.grav) q.vy *= 0.97; }
  G.parts = G.parts.filter(q => q.t > 0);
  for (const f of G.texts) { f.t -= dt; f.y -= 40 * dt; } G.texts = G.texts.filter(f => f.t > 0);
  for (const f of G.fx) f.t -= dt; G.fx = G.fx.filter(f => f.t > 0);
  for (const t of G.toasts) t.t -= dt; G.toasts = G.toasts.filter(t => t.t > 0);
  if (G.card) { G.card.t -= dt; if (G.card.t <= 0) G.card = null; }
  G.shake = Math.max(0, G.shake - dt);
}
function update(dt) {
  G.t += dt;
  if (pressed.mute) { muted = !muted; toast(muted ? 'Ses kapalı (M)' : 'Ses açık (M)'); }
  if (G.fade) {
    const f = G.fade; f.t += dt * 2.2;
    if (f.dir === 1 && f.t >= 1) { f.dir = -1; f.t = 0; f.cb && f.cb(); }
    else if (f.dir === -1 && f.t >= 1) G.fade = null;
    updateCommon(dt); return;
  }
  if (G.state === 'title') { if (pressed.ok || pressed.atk) { initAudio(); sfx('open'); G.flags = {}; G.hints = {}; G.time = 0; G.stats = { faints: 0, giraffes: 0, portals: 0, heals: 0, lasers: 0 }; G.active = 'oguzhan'; const s = +(new URLSearchParams(location.search).get('bolum') || 0); G.fade = { t: 0, dir: 1, cb: () => loadMap(clamp(s, 0, 3)) }; } return; }
  if (G.state === 'gameover') { G.endT += dt; if (G.endT > 1 && (pressed.ok || pressed.atk)) { G.fade = { t: 0, dir: 1, cb: () => loadMap(G.mapIndex, true) }; } updateCommon(dt); return; }
  if (G.state === 'ending') { G.endT += dt; if (G.endT > 4 && (pressed.ok)) { G.state = 'title'; } return; }
  if (G.state === 'dialogue') {
    const d = G.dlg, line = d.lines[d.i]; const before = Math.floor(d.ch); d.ch = Math.min(line[1].length, d.ch + dt * 55);
    if (Math.floor(d.ch) !== before && Math.floor(d.ch) % 3 === 0) sfx('blip');
    if (pressed.ok || pressed.atk || pressed.sp) {
      if (d.ch < line[1].length) d.ch = line[1].length;
      else { d.i++; d.ch = 0; if (d.i >= d.lines.length) { G.dlg = null; G.state = 'play'; G.p.inv = Math.max(G.p.inv, 0.6); d.cb && d.cb(); } }
    }
    updateCommon(dt); return;
  }
  if (G.state === 'play') {
    if (pressed.pause) G.paused = !G.paused;
    if (G.paused) return;
    updatePlay(dt); updateCommon(dt);
  }
}

// ---------------------------------------------------------------- render
function drawHero(id, x, y, moving, anim, flip, alpha = 1, ring = false) {
  const s = SPR[id]; if (!s) return;
  const fi = moving ? 1 + Math.floor(anim * 9) % 4 : 0;
  const img = (flip ? s.flipped : s.frames)[fi];
  ctx.save(); ctx.globalAlpha = alpha;
  if (ring) { ctx.strokeStyle = HERO[id].col; ctx.lineWidth = 2.5; ctx.globalAlpha = alpha * 0.8; ctx.beginPath(); ctx.ellipse(x, y + 6, 18, 7, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = alpha; }
  ctx.drawImage(img, Math.round(x - DW / 2), Math.round(y + 9 - DH));
  ctx.restore();
}
function shadow(x, y, rx = 16, ry = 6) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 6, rx, ry, 0, 0, 7); ctx.fill(); }
function drawDynamicTiles(x0, y0, x1, y1) {
  const t = G.t;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = tileAt(x, y), px = x * TILE, py = y * TILE;
    if (ch === 'B') {
      ctx.fillStyle = 'rgba(40,150,255,0.25)'; ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = 'rgba(120,220,255,0.9)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const o = (t * 40 + i * 12) % 48; ctx.beginPath(); ctx.moveTo(px, py + o); ctx.lineTo(px + TILE, py + ((o + 20) % 48)); ctx.stroke(); }
      ctx.fillStyle = '#9ad8ff'; ctx.fillRect(px + 20, py + 2, 8, 6); ctx.fillRect(px + 20, py + 40, 8, 6);
    } else if (ch === 'K') {
      const g = 0.5 + 0.5 * Math.sin(t * 3 + x);
      ctx.fillStyle = `rgba(160,80,255,${0.15 + g * 0.15})`; ctx.beginPath(); ctx.arc(px + 24, py + 26, 24, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a0f45'; ctx.beginPath(); ctx.moveTo(px + 24, py + 2); ctx.lineTo(px + 40, py + 22); ctx.lineTo(px + 34, py + 46); ctx.lineTo(px + 14, py + 46); ctx.lineTo(px + 8, py + 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b2fb5'; ctx.beginPath(); ctx.moveTo(px + 24, py + 6); ctx.lineTo(px + 36, py + 22); ctx.lineTo(px + 31, py + 42); ctx.lineTo(px + 24, py + 42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9a0ff'; ctx.fillRect(px + 25, py + 14, 4, 10);
    } else if (ch === 'F') {
      for (let i = 0; i < 3; i++) {
        const ox = Math.sin(t * 0.8 + x * 1.3 + i * 2) * 10, oy = Math.cos(t * 0.6 + y * 1.7 + i) * 8;
        ctx.fillStyle = `rgba(${110 + i * 15},${95 + i * 10},${140 + i * 10},0.33)`; ctx.beginPath(); ctx.arc(px + 24 + ox, py + 24 + oy, 22 - i * 4, 0, 7); ctx.fill();
      }
    } else if (ch === 'L' || ch === 'l') {
      ctx.fillStyle = '#6a6a72'; ctx.fillRect(px + 20, py + 4, 8, 42);
      ctx.fillStyle = '#3a3a40'; ctx.fillRect(px + 14, py + 30, 20, 14);
      const on = ch === 'l'; ctx.save(); ctx.translate(px + 24, py + 36); ctx.rotate(on ? 0.7 : -0.7);
      ctx.fillStyle = '#888'; ctx.fillRect(-2, -26, 4, 26); ctx.fillStyle = on ? '#4cff6a' : '#ff4a4a'; ctx.beginPath(); ctx.arc(0, -26, 6, 0, 7); ctx.fill(); ctx.restore();
      if (!on) { ctx.fillStyle = `rgba(255,220,60,${0.6 + 0.4 * Math.sin(t * 6)})`; ctx.font = 'bold 22px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', px + 24, py + 62 + Math.sin(t * 5) * 3); ctx.textAlign = 'left'; }
    } else if (ch === 'G') {
      ctx.fillStyle = '#2b2b33'; ctx.fillRect(px, py + 4, TILE, 6); ctx.fillRect(px, py + 38, TILE, 6);
      ctx.fillStyle = '#7d7d8a'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 4 + i * 12, py, 5, TILE);
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(px + 18, py + 20, 12, 10);
    } else if (ch === 'C') {
      ctx.fillStyle = '#3b2414'; ctx.fillRect(px + 2, py, TILE - 4, TILE); ctx.fillStyle = '#5a3a22'; ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
      ctx.fillStyle = `rgba(190,90,255,${0.5 + 0.5 * Math.sin(t * 4)})`; ctx.font = 'bold 18px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('ᛟ', px + 24, py + 31); ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(190,90,255,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(px + 4, py + 2, TILE - 8, TILE - 4);
    } else if (ch === 'X') {
      const ok = G.map.def.exitOk();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgb(${30 + i * 15},${28 + i * 14},${36 + i * 15})`; ctx.fillRect(px + 2, py + 2 + i * 11, TILE - 4, 11); }
      ctx.fillStyle = ok ? `rgba(80,255,120,${0.25 + 0.2 * Math.sin(t * 4)})` : 'rgba(255,60,60,0.25)'; ctx.fillRect(px, py, TILE, TILE);
      if (!ok) { ctx.strokeStyle = '#ff5050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 12, py + 12); ctx.lineTo(px + 36, py + 36); ctx.moveTo(px + 36, py + 12); ctx.lineTo(px + 12, py + 36); ctx.stroke(); }
    }
  }
}
function drawBubble(x, y, text, col = '#fff') {
  ctx.font = '13px ' + FONT; const lines = wrap(ctx, text, 220); const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * 16 + 10;
  const bx = clamp(x - w / 2, G.cam.x + 4, G.cam.x + VW - w - 4), by = y - h;
  ctx.fillStyle = 'rgba(15,12,25,0.88)'; rr(ctx, bx, by, w, h, 8); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,25,0.88)'; ctx.beginPath(); ctx.moveTo(x - 6, by + h); ctx.lineTo(x + 6, by + h); ctx.lineTo(x, by + h + 8); ctx.fill();
  ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, bx + 8, by + 18 + i * 16));
}
function drawNpc(n) {
  if (n.id === 'dragonling') { shadow(n.x, n.y, 30, 8); drawDragon(ctx, n.x, n.y - 60 + Math.sin(n.t * 3) * 4, n.t, { s: 0.4, cute: true }); return; }
  shadow(n.x, n.y);
  const cfg = Object.assign({}, NPCCFG[n.id], n.state === 'hurt' ? { mood: 'sad' } : {});
  const flip = G.p.x < n.x;
  drawHuman(ctx, n.x, n.y + 8, cfg, n.t, false, flip, 3.6, n.alpha);
  if (n.state === 'hurt') { ctx.fillStyle = `rgba(160,90,255,${0.3 + 0.2 * Math.sin(n.t * 3)})`; ctx.beginPath(); ctx.arc(n.x, n.y - 30, 34, 0, 7); ctx.fill(); }
}
function drawEnemy(e) {
  if (e.t === 'slime') { shadow(e.x, e.y); drawPaper(ctx, e.x, e.y + 4, e.tm, e.flash); }
  else if (e.t === 'bat') { shadow(e.x, e.y, 10, 4); drawBat(ctx, e.x, e.y, e.tm, e.flash); }
  else if (e.t === 'tibet' || e.t === 'mertata') {
    shadow(e.x, e.y, 18, 7);
    if (e.state === 'wind' && Math.floor(G.t * 20) % 2) { ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.beginPath(); ctx.arc(e.x, e.y - 30, 40, 0, 7); ctx.fill(); }
    const cfg = e.flash > 0 ? Object.assign({}, NPCCFG[e.t], { shirt: '#fff', skin: '#fff' }) : NPCCFG[e.t];
    drawHuman(ctx, e.x, e.y + 8, cfg, e.tm, e.state === 'walk' || e.state === 'dash' || e.t === 'mertata', G.p.x < e.x, 3.8);
    if (e.t === 'mertata') { ctx.fillStyle = `rgba(120,50,200,${0.25 + 0.1 * Math.sin(e.tm * 4)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y + 4, 30, 10, 0, 0, 7); ctx.fill(); }
    if (e.shield && e.active) { const col = SHIELD_COL[e.shield]; ctx.globalAlpha = 0.18; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(e.x, e.y - 36, 46, 0, 7); ctx.fill(); ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -G.t * 40; ctx.beginPath(); ctx.arc(e.x, e.y - 36, 46, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  } else if (e.t === 'dragon') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 110, 110, 26, 0, 0, 7); ctx.fill();
    drawDragon(ctx, e.x, e.y, e.tm, { shield: e.active ? e.shield : null, flash: e.flash, breath: e.breathW > 0 ? 1 - e.breathW / 0.9 : e.breathT > 0 ? 1 : 0 });
  }
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.state === 'loading') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); ctx.fillStyle = '#fff'; ctx.font = '20px ' + FONT; ctx.fillText('Yükleniyor...', 40, 60); return; }
  if (G.state === 'title') { renderTitle(); renderFade(); return; }
  if (G.state === 'ending') { renderEnding(); renderFade(); return; }
  const M = G.map, p = G.p, th = THEMES[M.theme];
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, VW, VH);
  const mw = M.w * TILE, mh = M.h * TILE;
  G.cam.x = mw <= VW ? (mw - VW) / 2 : clamp(p.x - VW / 2, 0, mw - VW);
  const fy = G.boss && G.boss.t === 'dragon' ? p.y * 0.4 + (G.boss.y + 20) * 0.6 : p.y - 30;
  G.cam.y = mh <= VH ? (mh - VH) / 2 : clamp(fy - VH / 2, 0, mh - VH);
  const sx = G.shake > 0 ? rand(-6, 6) * G.shake * 2 : 0, sy = G.shake > 0 ? rand(-6, 6) * G.shake * 2 : 0;
  const cx = Math.round(G.cam.x + sx), cy = Math.round(G.cam.y + sy);
  ctx.save(); ctx.translate(-cx, -cy);
  ctx.drawImage(M.layer, 0, 0);
  const x0 = Math.max(0, Math.floor(cx / TILE) - 1), y0 = Math.max(0, Math.floor(cy / TILE) - 1), x1 = Math.min(M.w - 1, Math.ceil((cx + VW) / TILE) + 1), y1 = Math.min(M.h - 1, Math.ceil((cy + VH) / TILE) + 1);
  drawDynamicTiles(x0, y0, x1, y1);
  for (const it of G.items) {
    if (it.fly) { const k = it.ft / it.fdur; const x = it.sx + (it.x - it.sx) * k, y = it.sy + (it.y - it.sy) * k - Math.sin(k * Math.PI) * 120; drawSimit(ctx, x, y, it.t); }
    else { shadow(it.x, it.y - 6, 10, 4); drawSimit(ctx, it.x, it.y, it.t); }
  }
  for (const f of G.fx) if (f.kind === 'portal') {
    const k = f.t / f.max; ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#2bff5a'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 26 * (1.2 - k * 0.2), 40, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b6ff9e'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 16, 28, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#0f7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, f.y, 22, 34, G.t * 3, 0, 4); ctx.stroke(); ctx.restore();
  }
  // y'ye göre sıralı çizim
  const list = [];
  for (const n of G.npcs) list.push([n.y, () => drawNpc(n)]);
  for (const e of G.enemies) list.push([e.t === 'dragon' ? e.y + 60 : e.y, () => drawEnemy(e)]);
  for (const g of G.giraffes) list.push([g.y, () => { shadow(g.x, g.y, 24, 6); drawGiraffe(ctx, g.x, g.y + 6, g.anim, g.flip, Math.min(1, g.t * 3)); }]);
  const others = HERO_IDS.filter(h => h !== G.active);
  others.forEach((h, i) => { const tr = G.trail[Math.max(0, G.trail.length - 1 - 13 * (i + 1))]; const st = G.party[h]; list.push([tr.y - 0.1, () => { shadow(tr.x, tr.y, 13, 5); drawHero(h, tr.x, tr.y, p.moving, p.anim + i * 0.3, tr.flip, st.down ? 0.3 : 0.85); }]); });
  list.push([p.y, () => { shadow(p.x, p.y); const blink = p.inv > 0 && Math.floor(G.t * 16) % 2 === 0; drawHero(G.active, p.x, p.y, p.moving, p.anim, p.flip, blink ? 0.45 : 1, true); if (G.party[G.active].sad) { ctx.fillStyle = 'rgba(80,70,120,0.7)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 84, 16, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9ab'; ctx.fillRect(p.x - 8, p.y - 78 + (G.t * 40 % 10), 2, 5); ctx.fillRect(p.x + 4, p.y - 76 + (G.t * 50 % 10), 2, 5); } }]);
  list.sort((a, b) => a[0] - b[0]); for (const [, f] of list) f();
  // mermiler
  for (const b of G.projs) {
    const y = b.y - 26;
    if (b.kind === 'laser') { const l = Math.hypot(b.vx, b.vy); ctx.strokeStyle = '#4fc3ff'; ctx.lineWidth = 7; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(b.x - b.vx / l * 24, y - b.vy / l * 24); ctx.lineTo(b.x, y); ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke(); }
    else if (b.kind === 'heart') { ctx.globalAlpha = 0.35; drawHeart(ctx, b.x, y, 2.4, '#ff6fcf'); ctx.globalAlpha = 1; drawHeart(ctx, b.x, y, 1.6, '#ff9fe0'); }
    else if (b.kind === 'paper') { ctx.save(); ctx.translate(b.x, y); ctx.rotate(b.rot); ctx.fillStyle = '#1c1422'; ctx.fillRect(-8, -10, 16, 20); ctx.fillStyle = '#f4f0e0'; ctx.fillRect(-7, -9, 14, 18); ctx.fillStyle = '#d62e2e'; ctx.fillRect(-4, -5, 8, 2); ctx.restore(); }
    else if (b.kind === 'dark') { ctx.fillStyle = 'rgba(130,60,220,0.4)'; ctx.beginPath(); ctx.arc(b.x, y, b.r + 5, 0, 7); ctx.fill(); ctx.fillStyle = '#2a0a4a'; ctx.beginPath(); ctx.arc(b.x, y, b.r, 0, 7); ctx.fill(); ctx.fillStyle = '#c9a0ff'; ctx.fillRect(b.x - 2, y - 2, 4, 4); }
    else if (b.kind === 'fire') { ctx.fillStyle = 'rgba(255,120,30,0.35)'; ctx.beginPath(); ctx.arc(b.x, y, b.r + 6, 0, 7); ctx.fill(); ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(b.x, y, b.r, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.arc(b.x, y, b.r * 0.5, 0, 7); ctx.fill(); }
  }
  for (const f of G.fx) {
    const k = 1 - f.t / f.max;
    if (f.kind === 'wave') { ctx.strokeStyle = f.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(f.x, f.y - 20, f.r * (0.4 + k * 0.6), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    if (f.kind === 'heal') { ctx.strokeStyle = '#7dff8a'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(f.x, f.y, 150 * k + 10, 60 * k + 4, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  for (const q of G.parts) {
    ctx.globalAlpha = clamp(q.t / q.max, 0, 1);
    if (q.heart) drawHeart(ctx, q.x, q.y, 1, q.col);
    else if (q.plus) { ctx.fillStyle = q.col; ctx.fillRect(q.x - 5, q.y - 1.5, 10, 3); ctx.fillRect(q.x - 1.5, q.y - 5, 3, 10); }
    else { ctx.fillStyle = q.col; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of G.texts) { ctx.globalAlpha = clamp(f.t * 2, 0, 1); ctx.font = 'bold ' + f.size + 'px ' + FONT; ctx.fillStyle = '#000'; ctx.fillText(f.text, f.x + 1, f.y + 1); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  for (const n of G.npcs) if (n.say) drawBubble(n.x, n.y - (n.id === 'dragonling' ? 110 : 84), n.say.text, SPK[n.id === 'dragonling' ? 'dragon' : n.id].col);
  if (G.bubble && G.state === 'play') drawBubble(p.x, p.y - 86, G.bubble.text, HERO[G.bubble.who] ? HERO[G.bubble.who].col : '#fff');
  ctx.restore();
  renderHUD();
  if (G.state === 'dialogue') renderDialogue();
  if (G.state === 'gameover') renderGameOver();
  if (G.paused) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VW, VH); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 40px ' + FONT; ctx.fillText('DURAKLATILDI', VW / 2, VH / 2 - 10); ctx.font = '18px ' + FONT; ctx.fillText('Devam etmek için P / ESC', VW / 2, VH / 2 + 26); ctx.textAlign = 'left'; }
  renderFade();
}
function renderHUD() {
  // öğretmen kartları
  HERO_IDS.forEach((id, i) => {
    const x = 10 + i * 162, y = 10, st = G.party[id], act = id === G.active, H = HERO[id];
    ctx.fillStyle = act ? 'rgba(20,16,32,0.92)' : 'rgba(20,16,32,0.7)'; rr(ctx, x, y, 154, 56, 8); ctx.fill();
    ctx.strokeStyle = act ? H.col : 'rgba(255,255,255,0.15)'; ctx.lineWidth = act ? 3 : 1; ctx.stroke();
    ctx.save(); ctx.globalAlpha = st.down ? 0.35 : 1; ctx.drawImage(SPR[id].portrait, x + 5, y + 5, 46, 46); ctx.restore();
    ctx.fillStyle = H.col; ctx.font = 'bold 14px ' + FONT; ctx.fillText(H.key + ' ' + H.name, x + 56, y + 19);
    ctx.fillStyle = '#331'; ctx.fillRect(x + 56, y + 25, 90, 9); ctx.fillStyle = st.hp / H.maxHp > 0.35 ? '#5fe06a' : '#ff5050'; ctx.fillRect(x + 56, y + 25, 90 * st.hp / H.maxHp, 9);
    ctx.fillStyle = '#fff'; ctx.font = '9px ' + FONT; ctx.fillText(st.down ? 'BAYGIN' : st.hp + '/' + H.maxHp + (st.sad ? '  kasvetli' : ''), x + 59, y + 33);
    const c = G.cds[id].sp / H.spCd; ctx.fillStyle = '#222'; ctx.fillRect(x + 56, y + 40, 90, 8); ctx.fillStyle = c > 0 ? '#556' : H.col; ctx.fillRect(x + 56, y + 40, 90 * (1 - c), 8);
    ctx.fillStyle = c > 0 ? '#ccc' : '#111'; ctx.font = 'bold 8px ' + FONT; ctx.fillText('E: ' + H.sp, x + 59, y + 47);
  });
  // görev
  if (G.obj) {
    ctx.font = '13px ' + FONT; const lines = wrap(ctx, G.obj, 250); const h = 24 + lines.length * 16;
    ctx.fillStyle = 'rgba(20,16,32,0.8)'; rr(ctx, VW - 280, 10, 270, h, 8); ctx.fill(); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 12px ' + FONT; ctx.fillText('GÖREV', VW - 270, 26);
    ctx.fillStyle = '#fff'; ctx.font = '13px ' + FONT; lines.forEach((l, i) => ctx.fillText(l, VW - 270, 42 + i * 16));
  }
  // boss
  const b = G.boss;
  if (b && b.alive) {
    const w = 520, x = (VW - w) / 2, y = VH - 78;
    ctx.fillStyle = 'rgba(20,10,15,0.85)'; rr(ctx, x - 8, y - 22, w + 16, 52, 8); ctx.fill();
    ctx.fillStyle = '#ffb0b0'; ctx.font = 'bold 14px ' + FONT; ctx.fillText(b.name, x, y - 6);
    ctx.fillStyle = '#300'; ctx.fillRect(x, y, w, 12); ctx.fillStyle = '#e0303a'; ctx.fillRect(x, y, w * b.hp / b.maxHp, 12);
    if (b.shield) { ctx.fillStyle = SHIELD_COL[b.shield]; ctx.font = 'bold 12px ' + FONT; ctx.fillText('◆ ' + SHIELD_TXT[b.shield], x, y + 26); }
    else { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px ' + FONT; ctx.fillText('◇ Kalkan yok — herkes saldırabilir!', x, y + 26); }
  }
  // ipuçları
  G.toasts.forEach((t, i) => {
    ctx.font = 'bold 14px ' + FONT; const w = Math.min(VW - 40, ctx.measureText(t.text).width + 24); const y = VH - (b ? 140 : 70) - i * 34;
    ctx.globalAlpha = clamp(t.t, 0, 1); ctx.fillStyle = 'rgba(15,12,25,0.88)'; rr(ctx, (VW - w) / 2, y, w, 28, 8); ctx.fill();
    ctx.fillStyle = t.col; ctx.textAlign = 'center'; ctx.fillText(t.text, VW / 2, y + 19, VW - 60); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  });
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px ' + FONT;
  ctx.fillText('WASD/Oklar: Yürü · SPACE/J: Saldırı · E/K: Özel · 1-2-3 / Q: Öğretmen değiştir · P: Duraklat · M: Ses', 10, VH - 8);
  if (G.card) {
    const a = clamp(Math.min(G.card.t, 3.2 - G.card.t) * 2, 0, 1); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 150, VW, 70);
    ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 30px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(G.card.text, VW / 2, 196); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
}
const PORTRAITS = {};
function renderDialogue() {
  const d = G.dlg, [who, text] = d.lines[d.i], sp = SPK[who];
  const x = 30, y = VH - 170, w = VW - 60, h = 150;
  ctx.fillStyle = 'rgba(12,10,22,0.94)'; rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = sp.col; ctx.lineWidth = 3; ctx.stroke();
  const por = SPR[who] ? SPR[who].portrait : PORTRAITS[who];
  ctx.fillStyle = '#000'; ctx.fillRect(x + 16, y + 20, 108, 108); if (por) ctx.drawImage(por, x + 18, y + 22, 104, 104);
  ctx.strokeStyle = sp.col; ctx.lineWidth = 2; ctx.strokeRect(x + 16, y + 20, 108, 108);
  ctx.fillStyle = sp.col; ctx.font = 'bold 19px ' + FONT; ctx.fillText(sp.name, x + 140, y + 34);
  ctx.fillStyle = '#fff'; ctx.font = '17px ' + FONT;
  wrap(ctx, text.slice(0, Math.floor(d.ch)), w - 160).slice(0, 4).forEach((l, i) => ctx.fillText(l, x + 140, y + 62 + i * 23));
  if (d.ch >= text.length) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(G.t * 6)})`; ctx.font = '13px ' + FONT; ctx.fillText('SPACE / ENTER ▶', x + w - 130, y + h - 12); }
}
function renderGameOver() {
  ctx.fillStyle = 'rgba(30,0,0,0.75)'; ctx.fillRect(0, 0, VW, VH); ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6a6a'; ctx.font = 'bold 44px ' + FONT; ctx.fillText('Tüm öğretmenler bayıldı!', VW / 2, VH / 2 - 30);
  ctx.fillStyle = '#fff'; ctx.font = '20px ' + FONT; ctx.fillText('Teneffüs bitti... ama pes etmek yok!', VW / 2, VH / 2 + 10);
  if (G.endT > 1) { ctx.font = 'bold 18px ' + FONT; ctx.fillStyle = '#ffd34d'; ctx.fillText('ENTER / SPACE ile bu bölümü tekrar dene', VW / 2, VH / 2 + 56); }
  ctx.textAlign = 'left';
}
function renderFade() { if (!G.fade) return; const a = G.fade.dir === 1 ? G.fade.t : 1 - G.fade.t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, VW, VH); }
function titleBg() {
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#3a1420'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * Math.sin(G.t * 2 + i)})`; ctx.fillRect(hash(i, 1) * VW, hash(i, 2) * VH * 0.6, 2, 2); }
}
function renderTitle() {
  titleBg();
  drawDragon(ctx, VW / 2, 160, G.t, { s: 0.75, shield: ['blue', 'pink', 'gold'][Math.floor(G.t / 2) % 3] });
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 230, VW, 110);
  ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.font = 'bold 58px ' + FONT; ctx.fillText('ÇAKABEY ZİNDANI', VW / 2 + 3, 293);
  ctx.fillStyle = '#ffd34d'; ctx.fillText('ÇAKABEY ZİNDANI', VW / 2, 290);
  ctx.fillStyle = '#fff'; ctx.font = '18px ' + FONT; ctx.fillText('Üç öğretmen ve ejderha Buncaişinarasındahayatlaradokunma', VW / 2, 322);
  HERO_IDS.forEach((id, i) => {
    const s = SPR[id]; if (!s) return; const x = VW / 2 - 200 + i * 200, y = 360, fi = 1 + Math.floor(G.t * 8) % 4;
    ctx.drawImage(s.img, fi * FR_W, 0, FR_W, FR_H, x - 45, y, 90, 160);
    ctx.fillStyle = HERO[id].col; ctx.font = 'bold 16px ' + FONT; ctx.fillText(HERO[id].name, x, y + 180);
    ctx.fillStyle = '#ddd'; ctx.font = '12px ' + FONT; ctx.fillText(HERO[id].atk + ' · ' + HERO[id].sp, x, y + 198);
  });
  ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(G.t * 4)})`; ctx.font = 'bold 20px ' + FONT; ctx.fillText('Başlamak için ENTER / SPACE', VW / 2, VH - 18);
  ctx.textAlign = 'left';
}
function renderEnding() {
  titleBg(); const t = G.endT;
  drawDragon(ctx, VW / 2, 120 + Math.sin(G.t * 2) * 6, G.t, { s: 0.45, cute: true });
  HERO_IDS.forEach((id, i) => { const s = SPR[id]; const x = VW / 2 - 160 + i * 160, fi = Math.floor(G.t * 3) % 2 ? 0 : 1; ctx.drawImage(s.img, fi * FR_W, 0, FR_W, FR_H, x - 36, 420 - Math.abs(Math.sin(G.t * 3 + i)) * 12, 72, 128); });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd34d'; ctx.font = 'bold 46px ' + FONT; ctx.fillText('SON', VW / 2, 228);
  ctx.fillStyle = '#fff'; ctx.font = '17px ' + FONT;
  const L = ['Oğuzhan, Şeyda ve Aykutcan Çakabey Zindanı\'ndan neşeyle döndü.', 'Evraklar azaldı, toplantılar kısaldı, ejderha okulun maskotu oldu.',
    'Ve öğretmenler bunca işin arasında yeniden... hayatlara dokundu.'];
  L.forEach((l, i) => { ctx.globalAlpha = clamp(t - i * 0.8, 0, 1); ctx.fillText(l, VW / 2, 268 + i * 26); });
  ctx.globalAlpha = clamp(t - 3, 0, 1);
  const mm = Math.floor(G.time / 60), ss = String(Math.floor(G.time % 60)).padStart(2, '0');
  ctx.fillStyle = '#9fe0ff'; ctx.font = '14px ' + FONT;
  ctx.fillText(`Süre: ${mm}:${ss}  ·  Bayılma: ${G.stats.faints}  ·  Çağrılan zürafa: ${G.stats.giraffes}  ·  Portal: ${G.stats.portals}  ·  Şifa: ${G.stats.heals}`, VW / 2, 365);
  ctx.fillStyle = '#ffb0e0'; ctx.fillText('Yardımcılar: Zeynep & Ekin  ·  Sonradan iyi olanlar: Tibet & Mert Ata', VW / 2, 390);
  ctx.globalAlpha = 1;
  // Öğretmenler Günü kutlaması
  if (t > 3.5) {
    const a = clamp(t - 3.5, 0, 1);
    for (let i = 0; i < 70; i++) { // konfeti
      const x = (hash(i, 7) * VW + Math.sin(G.t * 1.5 + i) * 20) % VW, y = (hash(i, 9) * VH + G.t * (40 + hash(i, 3) * 60)) % VH;
      ctx.globalAlpha = a * 0.8; ctx.fillStyle = ['#ffd34d', '#ff6fcf', '#47d4ff', '#7dff8a', '#ff9a3c'][i % 5];
      ctx.save(); ctx.translate(x, y); ctx.rotate(G.t * 3 + i); ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }
    ctx.globalAlpha = a;
    const s = 1 + 0.04 * Math.sin(G.t * 3);
    ctx.save(); ctx.translate(VW / 2, 586); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(20,10,30,0.85)'; rr(ctx, -400, -30, 800, 46, 12); ctx.fill();
    const gr = ctx.createLinearGradient(-380, 0, 380, 0); gr.addColorStop(0, '#ffd34d'); gr.addColorStop(0.5, '#ff6fcf'); gr.addColorStop(1, '#47d4ff');
    ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = 'bold 28px ' + FONT; ctx.fillStyle = '#000'; ctx.fillText('24 Kasım Öğretmenler Gününüz Kutlu Olsun', 2, 4);
    ctx.fillStyle = gr; ctx.fillText('24 Kasım Öğretmenler Gününüz Kutlu Olsun', 0, 2);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (t > 4) { ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(G.t * 4)})`; ctx.font = 'bold 14px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('ENTER: Ana menü', VW - 14, 26); }
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  try { update(dt); render(); } catch (err) { console.error(err); }
  for (const k in pressed) delete pressed[k];
  requestAnimationFrame(frame);
}
Promise.all(HERO_IDS.map(id => loadImg('assets/' + id + '.png').then(img => { SPR[id] = prerender(img); })))
  .then(() => {
    for (const id of ['zeynep', 'ekin', 'tibet', 'mertata']) PORTRAITS[id] = npcPortrait(id);
    PORTRAITS.dragon = dragonPortrait(); PORTRAITS.narrator = narratorPortrait();
    resetParty(); G.state = 'title';
  })
  .catch(err => { G.state = 'loading'; console.error(err); alert('Görseller yüklenemedi. Oyunu bir web sunucusu üzerinden (ör. GitHub Pages) açın.\n' + err.message); });
requestAnimationFrame(frame);
})();

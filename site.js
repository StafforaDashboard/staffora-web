/* Staffora – Startseite: Konfiguration laden, Links setzen, Karussell, 3D-Hintergrund starten.
 * Es wird nichts erfunden: Zahlen und Server erscheinen nur, wenn der Bot sie wirklich liefert. */
import { startScene, deviceProfile } from './scene.js';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const root = document.documentElement;
const profile = deviceProfile();

function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (_) {}
  return null;
}

/** Nur https-Adressen (und die eigene Seite) dürfen als Link gesetzt werden – nie javascript: o. Ä. */
export function safeHttps(u) {
  try { const x = new URL(String(u || ''), location.href); return x.protocol === 'https:' ? x.toString() : ''; } catch (_) { return ''; }
}
/** Symbole nur von Discord oder der eigenen Seite */
export function safeIcon(u) {
  try { const x = new URL(String(u || ''), location.href); return x.protocol === 'https:' && (x.hostname === 'cdn.discordapp.com' || x.hostname === location.hostname) ? x.toString() : ''; } catch (_) { return ''; }
}

async function getJSON(url, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) { return null; } finally { clearTimeout(timer); }
}

/* Bewegung: Voreinstellung aus dem Betriebssystem, Schalter für alle */
let motionOn = !profile.reduced && store('staffora_motion') !== 'off';
function applyMotionClass() { root.classList.toggle('no-motion', !motionOn); }
applyMotionClass();
if (!profile.low) root.classList.add('fx');

const cfg = (await getJSON('/site-config.json')) || {};
const showcase = (await getJSON('/showcase.json')) || { servers: [] };
const API = String(cfg.apiBase || window.STAFFORA_API || '').replace(/\/$/, '');

/* Links */
$$('[data-invite]').forEach((a) => { a.href = API ? API + '/invite' : '#'; if (!API) a.setAttribute('aria-disabled', 'true'); });
$$('[data-dashboard]').forEach((a) => { a.href = '/dashboard/'; });
const support = safeHttps(cfg.supportServerUrl);
if (support) { const l = $('#supportLink'); l.href = support; l.hidden = false; }
$('#year').textContent = String(new Date().getFullYear());

/* Navigation: beim Scrollen bekommt die Leiste einen Hintergrund, damit nichts darunter durchscheint */
const navBar = $('.nav');
function navState() { navBar.classList.toggle('is-scrolled', window.scrollY > 12); }
window.addEventListener('scroll', navState, { passive: true }); navState();

/* Navigation (Handy) */
const burger = $('#burger'), links = $('#navLinks');
burger.addEventListener('click', () => { const open = links.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen'); });
links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

/* Einblenden beim Scrollen */
if (motionOn && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
} else { $$('.reveal').forEach((el) => el.classList.add('in')); }

/* Echte Zahl: nur anzeigen, wenn der Bot antwortet */
if (API) {
  getJSON(API + '/api/public/stats', 6000).then((s) => {
    if (s && s.online && Number.isFinite(s.guilds) && s.guilds > 0) {
      $('#statText').textContent = 'Aktiv auf ' + s.guilds.toLocaleString('de-DE') + (s.guilds === 1 ? ' Server' : ' Servern');
      $('#statChip').hidden = false;
    }
  });
}

/* Upcore: nur echte Angaben aus site-config.json */
(function upcore() {
  const u = cfg.upcore || {};
  const card = $('#upcoreCard'), sec = $('#upcore');
  if (u.enabled === false) { sec.hidden = true; return; }
  $('#upcoreName').textContent = String(u.name || 'Upcore');
  const url = safeHttps(u.url);
  const text = String(u.text || '').trim();
  $('#upcoreText').textContent = text || 'Informationen zu Upcore folgen.';
  const btn = $('#upcoreBtn');
  btn.textContent = String(u.buttonLabel || 'Zu Upcore');
  if (url) { btn.href = url; } else { btn.removeAttribute('href'); btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Link folgt'; }
  $('#upcoreNote').hidden = !!(url && text);
  card.classList.add('in');
})();

/* Server-Karussell: sechs Karten – echte Server oder klar gekennzeichnete Platzhalter */
export function buildItems(cfgServers, realServers) {
  const items = [];
  for (const s of (Array.isArray(cfgServers) ? cfgServers : []).slice(0, 6)) {
    if (!s || (!s.name && !s.guildId)) continue;
    items.push({ guildId: String(s.guildId || ''), name: String(s.name || ''), description: String(s.description || ''), url: safeHttps(s.url), icon: safeIcon(s.icon), members: null, real: false });
  }
  for (const r of Array.isArray(realServers) ? realServers : []) {
    let it = items.find((i) => i.guildId && i.guildId === String(r.id));
    if (!it) { if (items.length >= 6) continue; items.push((it = { guildId: String(r.id), name: '', description: '', url: '', icon: '', members: null, real: false })); }
    it.name = String(r.name || it.name); it.icon = safeIcon(r.icon) || it.icon; it.members = Number.isFinite(r.memberCount) ? r.memberCount : null; it.real = true;
  }
  const out = items.filter((i) => i.name).slice(0, 6);
  while (out.length < 6) out.push({ placeholder: true });
  return out;
}

const real = API ? await getJSON(API + '/api/public/showcase', 6000) : null;
const items = buildItems(showcase.servers, real && real.servers);
const ring = $('#ring'), wrap = $('#ringWrap'), dotsEl = $('#dots'), live = $('#ringLive');
const nReal = items.filter((i) => !i.placeholder).length;
$('#showcaseNote').textContent = nReal === 0 ? 'Noch keine Server freigegeben – alle sechs Karten sind Platzhalter.' : nReal < 6 ? 'Die übrigen Karten sind Platzhalter.' : '';

items.forEach((it, i) => {
  const card = document.createElement('article');
  card.className = 'srv' + (it.placeholder ? ' ph' : '');
  card.style.setProperty('--i', String(i));
  const icon = document.createElement('div'); icon.className = 'srv-icon'; icon.setAttribute('aria-hidden', 'true');
  const h = document.createElement('h3');
  const meta = document.createElement('div'); meta.className = 'meta';
  const desc = document.createElement('p'); desc.className = 'desc';
  const tag = document.createElement('span'); tag.className = 'tag';
  if (it.placeholder) {
    icon.textContent = '+'; h.textContent = 'Platzhalter'; meta.textContent = 'Platz frei';
    desc.textContent = 'Erscheint hier, sobald ein Server freigegeben ist.'; tag.textContent = 'Platzhalter';
    card.setAttribute('aria-label', 'Platzhalter-Karte ' + (i + 1) + ' von 6');
    card.append(icon, h, meta, desc, tag);
  } else {
    const src = safeIcon(it.icon);
    if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; icon.append(img); } else { icon.textContent = it.name.charAt(0).toUpperCase(); }
    h.textContent = it.name;
    meta.textContent = it.members != null ? it.members.toLocaleString('de-DE') + ' Mitglieder' : '';
    desc.textContent = it.description || '';
    tag.textContent = it.real ? 'Live vom Bot' : 'Angabe des Betreibers';
    card.setAttribute('aria-label', it.name + ', Karte ' + (i + 1) + ' von 6');
    card.append(icon, h, meta, desc);
    if (it.url) { const a = document.createElement('a'); a.className = 'btn btn-sm'; a.href = it.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Server ansehen'; card.append(a); } else { card.append(tag); }
  }
  ring.append(card);
  const dot = document.createElement('button'); dot.type = 'button'; dot.setAttribute('aria-label', 'Karte ' + (i + 1) + ' anzeigen'); dot.addEventListener('click', () => go(i, true)); dotsEl.append(dot);
});

let cur = 0, timer = 0, hovering = false, inView = true;
const cards = $$('.srv', ring), dots = $$('button', dotsEl);
function paint() {
  ring.style.setProperty('--rot', (-cur * 60) + 'deg');
  cards.forEach((c, i) => c.classList.toggle('is-front', i === cur));
  dots.forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
  const it = items[cur];
  live.textContent = (it.placeholder ? 'Platzhalter' : it.name) + ', Karte ' + (cur + 1) + ' von ' + items.length;
}
function go(i, user) { cur = (i + items.length) % items.length; paint(); if (user) restart(); }
function tick() { if (!motionOn || hovering || !inView || document.hidden || wrap.classList.contains('flat')) return; go(cur + 1); }
function restart() { clearInterval(timer); if (motionOn) timer = setInterval(tick, 5200); }
$('#prev').addEventListener('click', () => go(cur - 1, true));
$('#next').addEventListener('click', () => go(cur + 1, true));
wrap.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); } if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); } });
wrap.addEventListener('pointerenter', () => { hovering = true; });
wrap.addEventListener('pointerleave', () => { hovering = false; });
wrap.addEventListener('focusin', () => { hovering = true; });
wrap.addEventListener('focusout', () => { hovering = false; });
if ('IntersectionObserver' in window) new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.2 }).observe(wrap);
// Ohne Bewegung oder auf sehr schmalen Bildschirmen: flache Wischleiste statt 3D-Ring
const narrow = matchMedia('(max-width: 520px)');
function layoutMode() { const flat = !motionOn || narrow.matches; wrap.classList.toggle('flat', flat); wrap.setAttribute('role', 'group'); }
narrow.addEventListener && narrow.addEventListener('change', layoutMode);
layoutMode(); paint(); restart();

/* 3D-Hintergrund */
const canvas = $('#scene');
const motionBtn = $('#motionBtn');
let scene = null;
function syncMotionBtn() {
  motionBtn.hidden = !scene || !scene.supported || profile.reduced;
  motionBtn.textContent = motionOn ? 'Bewegung pausieren' : 'Bewegung starten';
  motionBtn.setAttribute('aria-pressed', String(!motionOn));
}
try {
  scene = await startScene(canvas, { motion: motionOn });
} catch (_) { scene = { supported: false }; }
if (!scene.supported) { root.classList.add('no-webgl'); canvas.remove(); }
else root.classList.add('webgl');
syncMotionBtn();
motionBtn.addEventListener('click', () => {
  motionOn = !motionOn; store('staffora_motion', motionOn ? 'on' : 'off');
  applyMotionClass(); if (scene && scene.setMotion) scene.setMotion(motionOn);
  layoutMode(); restart(); syncMotionBtn();
});
window.__stafforaSite = { scene, items, profile }; // nur zum Testen/Fehlersuchen

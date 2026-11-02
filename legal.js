/* Rechtstexte: setzt die Angaben des Betreibers aus site-config.json ein.
 * Fehlende Pflichtangaben werden sichtbar als „fehlt“ markiert – es wird nichts erfunden. */
(async function () {
  var cfg = {};
  try { var r = await fetch('/site-config.json'); if (r.ok) cfg = await r.json(); } catch (e) {}
  var L = (cfg && cfg.legal) || {};
  var missing = [];
  function fill(el) {
    var key = el.getAttribute('data-legal');
    var v = String(L[key] || '').trim();
    if (v) { el.textContent = v; el.classList.add('filled'); }
    else { el.textContent = '[fehlt: ' + (el.getAttribute('data-label') || key) + ']'; el.classList.add('missing'); if (missing.indexOf(key) < 0) missing.push(key); }
  }
  document.querySelectorAll('[data-legal]').forEach(fill);
  var req = (document.body.getAttribute('data-required') || '').split(',').filter(Boolean);
  var gaps = req.filter(function (k) { return !String(L[k] || '').trim(); });
  var banner = document.getElementById('legalBanner');
  if (banner && gaps.length) banner.hidden = false;
  var up = document.getElementById('legalUpdated');
  if (up) up.textContent = String(L.updated || '').trim() || 'noch nicht eingetragen';
  document.getElementById('year') && (document.getElementById('year').textContent = String(new Date().getFullYear()));
})();

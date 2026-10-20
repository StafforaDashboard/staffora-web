/* Staffora Dashboard – Oberfläche (Navigation, Tastatur, Karten, Einrichtungsstand)
   Die Datenlogik bleibt in dashboard.js. Diese Datei fasst nur das Aussehen und
   das Verhalten der Bedienelemente an. Fehlt sie, funktioniert das Dashboard weiter. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (id) { return doc.getElementById(id); };
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  var renderStamp = 0; /* wann die aktuelle Seite zuletzt neu aufgebaut wurde */

  /* ---------- Navigation, Status-Popover, Tastatur ---------- */
  function setNav(open) {
    doc.body.classList.toggle('nav-open', open);
    var b = $('menuBtn'); if (b) b.setAttribute('aria-expanded', String(open));
  }
  function openPicker() {
    var sp = $('serverPicker'); if (!sp) return;
    sp.classList.add('open'); setNav(false);
    var si = $('serverSearch'); if (si) window.setTimeout(function () { si.focus(); }, 30);
  }
  function focusSearch() {
    var gs = $('globalSearch'); if (!gs) return;
    setNav(true); gs.focus(); gs.select();
  }
  function bindShell() {
    var mb = $('menuBtn'); if (mb) mb.addEventListener('click', function () { setNav(!doc.body.classList.contains('nav-open')); });
    var sc = $('scrim'); if (sc) sc.addEventListener('click', function () { setNav(false); });
    var back = $('allServers'); if (back) back.addEventListener('click', openPicker);

    /* Status-Popover */
    var pill = $('statusPill'), pop = $('statusPop');
    if (pill && pop) {
      var close = function () { pop.hidden = true; pill.setAttribute('aria-expanded', 'false'); };
      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = pop.hidden;
        pop.hidden = !open; pill.setAttribute('aria-expanded', String(open));
      });
      doc.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) close(); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    /* Serverwahl und Drawer: Klick neben das Fenster schließt */
    var sp = $('serverPicker');
    if (sp) sp.addEventListener('mousedown', function (e) { if (e.target === sp) sp.classList.remove('open'); });
    var dr = $('drawer');
    if (dr) dr.addEventListener('mousedown', function (e) { if (e.target === dr) dr.classList.remove('open'); });

    doc.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable);
      if (e.key === 'Escape') {
        setNav(false);
        if (sp) sp.classList.remove('open');
        if (dr) dr.classList.remove('open');
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); focusSearch(); return; }
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) { e.preventDefault(); focusSearch(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        var sb = $('saveAll');
        if (sb) { e.preventDefault(); sb.click(); }
      }
    });
  }

  /* ---------- Sticky-Kopf verdichten ---------- */
  var ticking = false;
  function updateStuck() {
    ticking = false;
    var h = doc.querySelector('.settings-heading');
    if (!h) return;
    var top = parseFloat(window.getComputedStyle(h).top) || 0;
    h.classList.toggle('is-stuck', h.getBoundingClientRect().top <= top + 1 && window.scrollY > 40);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateStuck); } }, { passive: true });

  /* ---------- Karten: einklappen, Sprungleiste, Werkzeuge ---------- */
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function cardKey(card) {
    var h = card.querySelector('.card-head h3');
    return (window.dashState && window.dashState.currentCat || '') + '|' + (h ? h.textContent.replace(/\s+/g, ' ').trim() : '');
  }
  function collapsedSet() {
    try { return new Set(JSON.parse(store.get('staffora_collapsed') || '[]')); } catch (e) { return new Set(); }
  }
  function saveCollapsed(set) { store.set('staffora_collapsed', JSON.stringify(Array.from(set).slice(-200))); }
  function setCollapsed(card, on, animate) {
    card.classList.toggle('is-collapsed', on);
    var b = card.querySelector('.card-toggle');
    if (b) { b.setAttribute('aria-expanded', String(!on)); b.setAttribute('aria-label', on ? 'Karte aufklappen' : 'Karte einklappen'); }
    if (animate && !on && !reduced) {
      card.classList.remove('just-opened'); void card.offsetWidth; card.classList.add('just-opened');
      window.setTimeout(function () { card.classList.remove('just-opened'); }, 320);
    }
  }
  function enhanceCards() {
    var panel = $('settingsPanel'); if (!panel) return;
    var set = collapsedSet();
    panel.querySelectorAll('.settings-card').forEach(function (card) {
      var head = card.querySelector('.card-head');
      if (!head || card.dataset.enh === '1' || card.classList.contains('home-tile')) return;
      if (!card.querySelector('.card-body')) return;
      card.dataset.enh = '1';
      var t = doc.createElement('button');
      t.type = 'button'; t.className = 'card-toggle'; t.innerHTML = CHEV;
      var h3 = head.querySelector('h3'); if (h3) h3.id = h3.id || ('ch' + Math.random().toString(36).slice(2, 8));
      head.appendChild(t);
      setCollapsed(card, set.has(cardKey(card)));
      var toggle = function () {
        var on = !card.classList.contains('is-collapsed');
        setCollapsed(card, on, true);
        var s2 = collapsedSet(); var k = cardKey(card);
        if (on) s2.add(k); else s2.delete(k);
        saveCollapsed(s2);
      };
      t.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      head.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select, textarea, label')) return;
        toggle();
      });
    });
  }

  /* Der Platz hinter dem Seitenkopf: Modul-Hinweis, Einrichtungsstand, dann die Sprungleiste */
  function anchorAfterHeading(panel) {
    var heading = panel.querySelector('.settings-heading');
    if (!heading) return null;
    var a = heading;
    var mb = panel.querySelector('.mod-banner'); if (mb) a = mb;
    var sc = panel.querySelector('.setup-card'); if (sc) a = sc;
    return a;
  }
  function buildIndex() {
    var panel = $('settingsPanel'); if (!panel) return;
    var old = panel.querySelector('.card-index'); if (old) old.remove();
    var grid = panel.querySelector('.settings-grid');
    var heading = panel.querySelector('.settings-heading');
    if (!grid || !heading || (window.dashState && window.dashState.currentCat === 'home')) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.settings-card')).filter(function (c) { return c.querySelector('.card-head h3') && !c.classList.contains('is-redundant'); });
    var hasSel = !!panel.querySelector('select[data-key], .role-btn');
    if (cards.length < 1) return;
    var bar = doc.createElement('nav');
    bar.className = 'card-index'; bar.setAttribute('aria-label', 'Auf dieser Seite');
    if (cards.length >= 3) {
      cards.forEach(function (c) {
        var h3 = c.querySelector('.card-head h3');
        var b = doc.createElement('button'); b.type = 'button';
        b.textContent = h3.firstChild ? h3.firstChild.textContent.trim() || h3.textContent.trim() : h3.textContent.trim();
        b.addEventListener('click', function () {
          setCollapsed(c, false, true);
          c.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          c.classList.remove('is-jump'); void c.offsetWidth; c.classList.add('is-jump');
        });
        bar.appendChild(b);
      });
    }
    var tools = doc.createElement('span'); tools.className = 'ci-tools';
    if (cards.length >= 3) {
      var all = doc.createElement('button'); all.type = 'button'; all.textContent = 'Alle zuklappen';
      all.addEventListener('click', function () {
        var anyOpen = cards.some(function (c) { return !c.classList.contains('is-collapsed'); });
        var s2 = collapsedSet();
        cards.forEach(function (c) { setCollapsed(c, anyOpen, true); var k = cardKey(c); if (anyOpen) s2.add(k); else s2.delete(k); });
        saveCollapsed(s2);
        all.textContent = anyOpen ? 'Alle aufklappen' : 'Alle zuklappen';
      });
      tools.appendChild(all);
    }
    if (hasSel && typeof window.refreshDiscordData === 'function') {
      var rd = doc.createElement('button'); rd.type = 'button';
      rd.textContent = 'Kanäle und Rollen neu laden';
      rd.title = 'Lädt Kanäle und Rollen von Discord neu. Deine Eingaben bleiben erhalten.';
      rd.addEventListener('click', function () { window.refreshDiscordData(); });
      tools.appendChild(rd);
    }
    if (tools.children.length) bar.appendChild(tools);
    if (!bar.children.length) return;
    anchorAfterHeading(panel).insertAdjacentElement('afterend', bar);
  }

  /* ---------- Einrichtungsstand: wie viele Auswahlfelder der Seite sind gesetzt ---------- */
  function setupFields(panel) {
    var out = [];
    var skip = '.live-block, .file-upload-block, .rc-root, .structured-form, .home-wide';
    panel.querySelectorAll('.settings-grid select[data-key], .settings-grid .role-btn[data-key]').forEach(function (el) {
      if (!el.getAttribute('data-key')) return;
      if (el.closest(skip)) return;
      if (el.tagName === 'SELECT') {
        if (!el.options.length || el.options[0].value !== '') return; /* An/Aus und feste Auswahl zählen nicht */
        out.push(el.value !== '');
      } else {
        out.push(el.classList.contains('has-value'));
      }
    });
    return out;
  }
  function updateSetup() {
    var panel = $('settingsPanel'); if (!panel) return;
    var cat = window.dashState && window.dashState.currentCat;
    var card = panel.querySelector('.setup-card');
    var heading = panel.querySelector('.settings-heading');
    if (!heading || cat === 'home' || cat === 'module') { if (card) card.remove(); return; }
    var f = setupFields(panel);
    if (f.length < 2) { if (card) card.remove(); return; }
    var done = f.filter(Boolean).length, total = f.length;
    if (!card) {
      card = doc.createElement('div');
      card.className = 'setup-card';
      card.innerHTML = '<div class="sc-top"><b>Einrichtung</b><span class="sc-count"></span></div><div class="sc-bar" role="progressbar" aria-label="Einrichtung" aria-valuemin="0"><i></i></div>';
      var mb = panel.querySelector('.mod-banner');
      (mb || heading).insertAdjacentElement('afterend', card);
      var bar0 = card.querySelector('.sc-bar i');
      if (bar0) { bar0.style.width = '0%'; void bar0.offsetWidth; }
    }
    var pct = Math.round(done / total * 100);
    card.classList.toggle('is-done', done === total);
    card.querySelector('.sc-count').textContent = done === total ? 'Alles gesetzt (' + total + ' von ' + total + ')' : done + ' von ' + total + ' Auswahlfeldern gesetzt';
    var bar = card.querySelector('.sc-bar');
    bar.setAttribute('aria-valuemax', String(total)); bar.setAttribute('aria-valuenow', String(done));
    card.querySelector('.sc-bar i').style.width = pct + '%';
  }
  var setupTimer = 0;
  function scheduleSetup() {
    window.clearTimeout(setupTimer);
    setupTimer = window.setTimeout(function () { try { updateSetup(); } catch (e) {} }, 160);
  }

  /* ---------- Zahlen der Übersicht zählen beim Öffnen hoch ---------- */
  function countUp() {
    if (reduced) return;
    if (Date.now() - renderStamp > 1500) return; /* nur beim Öffnen der Seite, nicht bei der Minuten-Aktualisierung */
    doc.querySelectorAll('.home-tile').forEach(function (t) {
      var lab = t.querySelector('.ht-label'), val = t.querySelector('.ht-value');
      if (!lab || !val || val.dataset.cu) return;
      val.dataset.cu = '1';
      if (!/^(Module aktiv|Hinweise)$/.test(lab.textContent.trim())) return;
      var m = /^(\d+)(.*)$/.exec(val.textContent.trim());
      if (!m) return;
      var end = parseInt(m[1], 10), rest = m[2];
      if (!(end > 0)) return;
      var t0 = 0, dur = 750;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        val.textContent = Math.round(end * e) + rest;
        if (p < 1) requestAnimationFrame(step);
      };
      val.textContent = '0' + rest;
      requestAnimationFrame(step);
    });
  }

  var pending = 0;
  function enhance() {
    pending = 0;
    try { enhanceCards(); updateSetup(); buildIndex(); updateStuck(); countUp(); } catch (e) { if (window.console) console.warn('[dashboard-ui]', e); }
  }
  function schedule() { if (!pending) pending = window.setTimeout(enhance, 40); }
  function observe() {
    var panel = $('settingsPanel'); if (!panel || !window.MutationObserver) return;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var added = list[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.classList.contains('settings-heading')) renderStamp = Date.now();
          if (n.classList.contains('settings-heading') || n.classList.contains('settings-card') || n.classList.contains('settings-grid') || n.classList.contains('rc-root') || n.classList.contains('home-tile') || n.classList.contains('home-grid')) { schedule(); }
        }
      }
    }).observe(panel, { childList: true, subtree: true });
    /* Auswahl geändert (Feld, Rollen-Fenster): Einrichtungsstand neu zählen */
    ['input', 'change', 'click'].forEach(function (ev) { doc.addEventListener(ev, function () { if (panel.querySelector('.setup-card') || panel.querySelector('.role-btn')) scheduleSetup(); }, true); });
  }

  function init() { bindShell(); observe(); schedule(); }
  window.DashUI = { enhance: enhance, setNav: setNav, openPicker: openPicker };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();

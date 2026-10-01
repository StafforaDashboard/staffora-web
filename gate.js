/**
 * Early-access lock gate for Dashboard / IC Panel
 * Homepage stays public.
 */
(function () {
  if (!window.STAFFORA_EARLY_ACCESS) return;
  var API = window.StafforaAPI;
  if (!API) return;

  function injectStyles() {
    if (document.getElementById('staffora-gate-css')) return;
    var s = document.createElement('style');
    s.id = 'staffora-gate-css';
    s.textContent = [
      '#staffora-gate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;',
      'background:rgba(3,6,14,.92);backdrop-filter:blur(14px);opacity:0;transition:opacity .35s ease}',
      '#staffora-gate.show{opacity:1}',
      '#staffora-gate .gate-card{width:min(400px,92vw);padding:32px 28px;border-radius:20px;',
      'border:1px solid rgba(117,91,255,.35);background:linear-gradient(160deg,rgba(14,18,36,.98),rgba(6,10,22,.95));',
      'box-shadow:0 30px 80px rgba(0,0,0,.55);text-align:center;transform:translateY(12px);transition:transform .4s ease}',
      '#staffora-gate.show .gate-card{transform:none}',
      '#staffora-gate .lock{width:64px;height:64px;margin:0 auto 18px;border-radius:18px;',
      'display:grid;place-items:center;font-size:28px;',
      'background:linear-gradient(145deg,#7c3cff,#3b82f6);box-shadow:0 0 40px rgba(124,60,255,.45);',
      'animation:gateLock 1.2s ease-in-out infinite}',
      '@keyframes gateLock{0%,100%{transform:scale(1) rotate(0)}40%{transform:scale(1.06) rotate(-4deg)}70%{transform:scale(1.04) rotate(4deg)}}',
      '#staffora-gate h2{margin:0 0 8px;font-size:22px;letter-spacing:-.02em}',
      '#staffora-gate p{margin:0 0 18px;color:#9aa3b8;font-size:14px;line-height:1.5}',
      '#staffora-gate input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(117,91,255,.3);',
      'background:rgba(0,0,0,.35);color:#fff;outline:0;font-size:15px;letter-spacing:.06em;text-align:center;margin-bottom:12px}',
      '#staffora-gate input:focus{border-color:#8b5cf6}',
      '#staffora-gate .btn{width:100%;padding:12px;border-radius:12px;border:0;cursor:pointer;font-weight:700;',
      'background:linear-gradient(135deg,#7c3cff,#3b82f6);color:#fff}',
      '#staffora-gate .btn:disabled{opacity:.6;cursor:wait}',
      '#staffora-gate .gate-err{min-height:18px;margin-top:10px;color:#f87171;font-size:13px}',
      '#staffora-gate .gate-home{display:inline-block;margin-top:16px;color:#8b93a8;font-size:13px;text-decoration:none}',
      '#staffora-gate .gate-home:hover{color:#fff}',
      'body.staffora-locked .app-shell,body.staffora-locked .dashboard-shell{filter:blur(6px);pointer-events:none;user-select:none}'
    ].join('');
    document.head.appendChild(s);
  }

  function showGate(onSuccess) {
    injectStyles();
    document.body.classList.add('staffora-locked');
    var el = document.getElementById('staffora-gate');
    if (!el) {
      el = document.createElement('div');
      el.id = 'staffora-gate';
      el.innerHTML = [
        '<div class="gate-card">',
        '<div class="lock" aria-hidden="true">🔒</div>',
        '<h2>Early Access</h2>',
        '<p>Enter your 32-character key to continue.</p>',
        '<input id="gateKey" type="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="••••••••••••••••••••••••••••••••">',
        '<button type="button" class="btn" id="gateSubmit">Unlock</button>',
        '<div class="gate-err" id="gateErr"></div>',
        '<a class="gate-home" href="/">← Home</a>',
        '</div>'
      ].join('');
      document.body.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('show'); });
    } else {
      el.classList.add('show');
    }

    var input = document.getElementById('gateKey');
    var btn = document.getElementById('gateSubmit');
    var err = document.getElementById('gateErr');
    if (API.getAccessKey()) input.value = API.getAccessKey();

    async function submit() {
      err.textContent = '';
      btn.disabled = true;
      try {
        await API.validateAccessKey(input.value);
        el.classList.remove('show');
        document.body.classList.remove('staffora-locked');
        setTimeout(function () {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 320);
        if (typeof onSuccess === 'function') onSuccess();
      } catch (e) {
        err.textContent = 'Error';
        btn.disabled = false;
      }
    }
    btn.onclick = submit;
    input.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
    setTimeout(function () { input.focus(); }, 200);
  }

  window.StafforaGate = {
    ensure: function (onReady) {
      if (!window.STAFFORA_EARLY_ACCESS || API.hasAccess()) {
        if (typeof onReady === 'function') onReady();
        return;
      }
      showGate(onReady);
    }
  };
})();

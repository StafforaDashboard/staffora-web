(function () {
  var API = window.StafforaAPI;
  var state = { guildId: null, username: null, userId: null, questions: [] };

  function $(id) { return document.getElementById(id); }
  function show(id) {
    document.querySelectorAll('.step').forEach(function (s) { s.classList.remove('on'); });
    $(id).classList.add('on');
  }
  function msg(el, text, kind) {
    el.hidden = false;
    el.className = 'notice' + (kind ? ' ' + kind : '');
    el.textContent = text;
  }

  async function loadServers() {
    var sel = $('serverSelect');
    try {
      var data = await API.unbanServers();
      var list = data.servers || data.guilds || data || [];
      if (!Array.isArray(list)) list = [];
      if (!list.length) {
        sel.innerHTML = '<option value="">Keine Server</option>';
        return;
      }
      sel.innerHTML = '<option value="">Server wählen…</option>' + list.map(function (g) {
        var id = g.id || g.guildId;
        var name = g.name || id;
        return '<option value="' + String(id).replace(/"/g, '') + '">' + String(name).replace(/</g, '') + '</option>';
      }).join('');
    } catch (e) {
      sel.innerHTML = '<option value="">Error</option>';
    }
  }

  $('btnCheck').onclick = async function () {
    var gid = $('serverSelect').value;
    var name = ($('robloxName').value || '').trim();
    var box = $('checkMsg');
    if (!gid || !name) { msg(box, 'Server und Roblox-Name ausfüllen.', 'err'); return; }
    box.hidden = true;
    try {
      var r = await API.unbanCheck(gid, name);
      if (!r.ok) {
        msg(box, r.message || r.reason || 'Es sind keine Bans auf deinem Konto registriert.', 'err');
        return;
      }
      state.guildId = gid;
      state.username = r.robloxUsername || name;
      state.userId = r.robloxUserId || null;
      state.questions = Array.isArray(r.questions) && r.questions.length
        ? r.questions
        : ['Warum sollte der Ban aufgehoben werden?', 'Was hast du gelernt?'];
      $('checkOk').textContent = 'Ban gefunden für ' + state.username + ' — bitte Formular ausfüllen.';
      var q = $('questions');
      q.innerHTML = state.questions.map(function (text, i) {
        var t = typeof text === 'string' ? text : (text.q || text.question || 'Frage ' + (i + 1));
        return '<div class="field"><label class="label">' + t.replace(/</g, '') + '</label><textarea data-qi="' + i + '" required></textarea></div>';
      }).join('');
      show('step2');
    } catch (e) {
      msg(box, 'Error', 'err');
    }
  };

  $('btnBack').onclick = function () { show('step1'); };

  $('btnSubmit').onclick = async function () {
    var box = $('submitMsg');
    var answers = [];
    document.querySelectorAll('#questions textarea').forEach(function (ta, i) {
      answers.push({ question: state.questions[i], answer: (ta.value || '').trim() });
    });
    if (answers.some(function (a) { return !a.answer; })) {
      msg(box, 'Bitte alle Fragen beantworten.', 'err');
      return;
    }
    try {
      await API.unbanSubmit(state.guildId, {
        robloxUsername: state.username,
        robloxUserId: state.userId,
        answers: answers
      });
      msg(box, 'Appeal gesendet.', 'ok');
      $('btnSubmit').disabled = true;
    } catch (e) {
      msg(box, 'Error', 'err');
    }
  };

  loadServers();
})();

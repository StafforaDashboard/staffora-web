(function(){
  var API = window.STAFFORA_API || 'https://staffora.apps.bot-hosting.cloud';
  function getToken(){
    try { return localStorage.getItem('staffora_token') || ''; } catch(e){ return ''; }
  }
  function showView(name){
    try {
      document.body.setAttribute('data-view', name);
      var land = document.getElementById('view-landing');
      var sel = document.getElementById('view-select');
      var app = document.getElementById('view-app');
      if(land) land.classList.toggle('hidden', name !== 'landing');
      if(sel) sel.classList.toggle('hidden', name !== 'select');
      if(app) app.classList.toggle('hidden', name !== 'app');
    } catch(e){}
  }
  function enterApp(){
    showView('app');
    try {
      var u = JSON.parse(localStorage.getItem('staffora_user')||'null');
      if(u){
        var av = document.getElementById('side-av');
        var nm = document.getElementById('side-name');
        var meta = document.getElementById('side-meta');
        if(av && u.username) av.textContent = (u.username||'S')[0].toUpperCase();
        if(nm && u.username) nm.textContent = u.username;
        if(meta) meta.textContent = 'Eingeloggt';
      }
    } catch(e){}
    var t = getToken();
    if(!t) return;
    fetch(API + '/api/me', {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + t }
    }).then(function(r){
      if(r.status === 401 || r.status === 403){
        try{ localStorage.removeItem('staffora_token'); localStorage.removeItem('staffora_user'); }catch(e){}
        showView('landing');
      }
      return r.json().catch(function(){ return null; });
    }).then(function(d){
      if(d && d.user){
        try{ localStorage.setItem('staffora_user', JSON.stringify(d.user)); }catch(e){}
      }
    }).catch(function(){});
  }
  if(getToken()){
    enterApp();
  } else {
    showView('landing');
  }
  document.addEventListener('click', function(ev){
    var t = ev.target;
    if(t && (t.id === 'btn-logout' || (t.closest && t.closest('#btn-logout')))){
      try{ localStorage.removeItem('staffora_token'); localStorage.removeItem('staffora_user'); }catch(e){}
      showView('landing');
      location.reload();
    }
  });
})();

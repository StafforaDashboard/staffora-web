(function(){
  var n = 9;
  var idxs = [];
  for (var i=0;i<n;i++) idxs.push(i);
  Promise.all(idxs.map(function(i){
    return fetch('dpart'+i+'.js?v=10').then(function(r){
      if(!r.ok) throw new Error('Teil '+i+' fehlgeschlagen ('+r.status+')');
      return r.text();
    });
  })).then(function(texts){
    var s = document.createElement('script');
    s.textContent = texts.join('');
    document.body.appendChild(s);
  }).catch(function(e){
    var el = document.createElement('div');
    el.style.cssText = 'padding:24px;font-family:system-ui;background:#08080a;color:#f4f4f5;min-height:100vh';
    el.innerHTML = '<h1>Staffora</h1><p>Dashboard-Code konnte nicht geladen werden.</p><p style="color:#a1a1aa">'+String(e.message||e)+'</p><p style="color:#a1a1aa">Hard-Refresh versuchen.</p>';
    document.body.appendChild(el);
  });
})();

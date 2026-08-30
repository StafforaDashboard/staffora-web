(function(){
  var idxs = [0, 1, 2];
  Promise.all(idxs.map(function(i){
    return fetch('capp'+i+'.js?v=5').then(function(r){
      if(!r.ok) throw new Error('capp'+i+' HTTP '+r.status);
      return r.text();
    });
  })).then(function(texts){
    var code = texts.join('');
    var el = document.createElement('script');
    el.textContent = code;
    document.body.appendChild(el);
  }).catch(function(e){
    var d=document.createElement('div');
    d.style.cssText='color:#fca5a5;font-family:system-ui;padding:40px;background:#08080a;min-height:100vh';
    d.innerHTML='<b>Dashboard-Script Fehler:</b> '+String(e)+
      '<br><br>Bot muss online sein für Login: <code>staffora.apps.bot-hosting.cloud</code>';
    document.body.appendChild(d);
  });
})();

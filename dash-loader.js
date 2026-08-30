(function(){
  var n=5;
  var idxs=[]; for(var i=0;i<n;i++) idxs.push(i);
  Promise.all(idxs.map(function(i){
    return fetch('da'+i+'.js?v=12').then(function(r){
      if(!r.ok) throw new Error('da'+i+' '+r.status);
      return r.text();
    });
  })).then(function(texts){
    var s=document.createElement('script');
    s.textContent=texts.join('');
    document.body.appendChild(s);
  }).catch(function(e){
    document.body.innerHTML='<div style="padding:24px;font-family:system-ui;background:#08080a;color:#f4f4f5"><h1>Staffora</h1><p>'+String(e.message||e)+'</p></div>';
  });
})();

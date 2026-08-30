(function(){
  var n=2;
  Promise.all(Array.from({length:n},function(_,i){
    return fetch('zb'+i+'.txt?v=15').then(function(r){
      if(!r.ok) throw new Error('zb'+i+' '+r.status);
      return r.text();
    });
  })).then(function(parts){
    var b64 = parts.join('');
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return new Response(bytes).arrayBuffer().then(function(buf){
      return new Response(buf).body.pipeThrough(new DecompressionStream('gzip')).arrayBuffer();
    });
  }).then(function(buf){
    var code = new TextDecoder().decode(buf);
    var s=document.createElement('script');
    s.textContent=code;
    document.body.appendChild(s);
  }).catch(function(e){
    document.body.innerHTML='<div style="padding:24px;font-family:system-ui;background:#08080a;color:#f4f4f5"><h1>Staffora</h1><p>'+String(e.message||e)+'</p></div>';
  });
})();

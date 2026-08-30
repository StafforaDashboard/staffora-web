(function(){
  var n=2;
  Promise.all(Array.from({length:n},function(_,i){
    return fetch('zb'+i+'.txt?v=16').then(function(r){
      if(!r.ok) throw new Error('Asset zb'+i+' ('+r.status+')');
      return r.text();
    });
  })).then(function(parts){
    var b64=parts.join('');
    var bin=atob(b64);
    var bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return new Response(bytes).arrayBuffer().then(function(buf){
      return new Response(buf).body.pipeThrough(new DecompressionStream('gzip')).arrayBuffer();
    });
  }).then(function(buf){
    var s=document.createElement('script');
    s.textContent=new TextDecoder().decode(buf);
    document.body.appendChild(s);
  }).catch(function(e){
    document.body.innerHTML='<div style="padding:32px;font-family:system-ui;background:#08080a;color:#f4f4f5;min-height:100vh"><h1>Staffora</h1><p style="color:#a1a1aa">'+String(e.message||e)+'</p><p style="color:#71717a;margin-top:12px">Hard-Refresh (Ctrl+Shift+R). API muss online sein für Login/Daten.</p></div>';
  });
})();

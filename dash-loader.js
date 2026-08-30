(function(){
  var n=3;
  Promise.all(Array.from({length:n},function(_,i){
    return fetch('zb'+i+'.txt?v=20').then(function(r){
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
    document.body.insertAdjacentHTML('beforeend','<div style="padding:24px;color:#fca5a5;font-family:system-ui">'+String(e.message||e)+'</div>');
  });
})();

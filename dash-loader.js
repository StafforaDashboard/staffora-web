(function(){
  var n=11;
  Promise.all(Array.from({length:n},function(_,i){
    return fetch('a'+i+'.txt?v=25').then(function(r){
      if(!r.ok) throw new Error('a'+i+' '+r.status);
      return r.text();
    });
  })).then(function(parts){
    var bin=atob(parts.join(''));
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
    document.body.insertAdjacentHTML('beforeend','<div style="padding:24px;color:#fca5a5;font-family:system-ui">'+e.message+'</div>');
  });
})();

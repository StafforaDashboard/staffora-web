(function(){
  function wire(){
    try{
      var API=(window.STAFFORA_API||"https://staffora.apps.bot-hosting.cloud").replace(/\/$/,"");
      var login=API+"/auth/login?return="+encodeURIComponent(location.href.split("#")[0]);
      ["btn-login","btn-login2","btn-login-nav"].forEach(function(id){
        var el=document.getElementById(id); if(el) el.href=login;
      });
      var inv=document.getElementById("btn-invite");
      if(inv && (!inv.href || inv.href.endsWith("#"))) inv.href=API+"/invite";
    }catch(e){}
  }
  function enhance(){
    var box=document.getElementById("guilds");
    if(!box)return;
    box.querySelectorAll("[data-id]").forEach(function(el){
      if(el.classList.contains("server-card"))return;
      var name=(el.querySelector("strong")||{}).textContent||el.textContent.trim().split("\n")[0]||"Server";
      name=name.trim();
      var txt=el.textContent||"";
      var bot=false;
      if(/Bot installiert|Bot online/i.test(txt)) bot=true;
      if(/Bot fehlt|Invite/i.test(txt)) bot=false;
      var letter=name.charAt(0).toUpperCase();
      var img=el.querySelector("img");
      var av=img?'<img src="'+img.src+'" alt=""/>':letter;
      var st=bot?'<span class="server-st ok">Bot online</span>':'<span class="server-st warn">Invite nötig</span>';
      el.className="server-card";
      el.innerHTML='<div class="server-av">'+av+'</div><div class="server-meta"><strong>'+name+'</strong><div class="mc"></div></div>'+st;
    });
  }
  document.addEventListener("DOMContentLoaded",function(){wire();setInterval(enhance,400);});
  wire();
})();

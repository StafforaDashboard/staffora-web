tContent = '↻ …';
      cfg = await api('/api/guilds/'+guild.id+'/config');
      guild = Object.assign({}, guild, cfg.guild||{});
      await loadDiscord();
      await loadExtra();
      render();
      toast('Server-Daten aktualisiert');
    }catch(e){ toast(e.message||'Fehler'); }
    finally{
      var b=$('btn-refresh-data'); if(b){ b.disabled=false; b.textContent='↻ Daten aktualisieren'; }
    }
  });
  document.getElementById('btn-refresh-discord') && ($('btn-refresh-discord').onclick = async function(){
    if(!guild){ toast('Kein Server gewählt'); return; }
    try{
      $('btn-refresh-discord').disabled = true;
      await loadDiscord();
      render();
      toast('Channels & Rollen neu geladen');
    }catch(e){ toast(e.message||'Fehler'); }
    finally{
      var b=$('btn-refresh-discord'); if(b){ b.disabled=false; b.textContent='↻ Channels / Rollen'; }
    }
  });
  if($('btn-menu')) $('btn-menu').onclick = function(){ if($('sidebar')) $('sidebar').classList.add('open'); if($('scrim')) $('scrim').classList.add('on'); };
  if($('scrim')) $('scrim').onclick = function(){ if($('sidebar')) $('sidebar').classList.remove('open'); if($('scrim')) $('scrim').classList.remove('on'); };
  document.querySelectorAll('.nav-item').forEach(function(b){ b.onclick = function(){ setTab(b.dataset.tab); }; });

  (function(){
    var content = document.getElementById('panel');
    if(content){
      var obs = new MutationObserver(function(){ setTimeout(function(){ try{ enhanceDiscordSelects(content); }catch(e){} }, 0); });
      obs.observe(content, { childList: true, subtree: false });
    }
  })();
  var _panelEl = document.getElementById('panel');
  if(_panelEl) _panelEl.addEventListener('click', async function(e){
    var btn = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if(!btn) return;
    var act = btn.getAttribute('data-act');
    if(act==='refresh-data'){
      if(!guild) return;
      try{
        btn.disabled = true; btn.textContent = '↻ …';
        cfg = await api('/api/guilds/'+guild.id+'/config');
        guild = Object.assign({}, guild, cfg.guild||{});
        await loadDiscord();
        await loadExtra();
        render();
        toast('Aktualisiert');
      }catch(err){ toast(err.message||'Fehler'); }
      finally{ /* re-rendered */ }
    }
    if(act==='refresh-servers'){
      show('select');
      await loadGuilds();
      toast('Serverliste');
    }
  });

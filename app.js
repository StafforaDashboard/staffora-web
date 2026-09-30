// Staffora shared demo interactions
const langButton=document.querySelector('[data-lang]');
if(langButton){let langs=[['🇩🇪','Deutsch'],['🇬🇧','English']];let i=0;langButton.addEventListener('click',()=>{i=(i+1)%langs.length;langButton.textContent=langs[i][0]+' '+langs[i][1]+'⌄';document.documentElement.lang=i?'en':'de';window.dispatchEvent(new CustomEvent('staffora:language',{detail:langs[i][1]}));});}
document.querySelectorAll('[data-tilt]').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=e.clientX/r.width-.5,y=e.clientY/r.height-.5;el.style.transform=`perspective(1000px) rotateX(${y*-8}deg) rotateY(${x*10}deg)`});el.addEventListener('mouseleave',()=>el.style.transform='');});
document.querySelectorAll('[data-toggle]').forEach(t=>t.addEventListener('click',()=>t.classList.toggle('on')));

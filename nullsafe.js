(function(){
  var _ge = document.getElementById.bind(document);
  document.getElementById = function(id){
    var el = _ge(id);
    if (el) return el;
    var d = document.createElement("span");
    d.id = id;
    d.style.display = "none";
    try { document.body.appendChild(d); } catch (e) {}
    return d;
  };
})();

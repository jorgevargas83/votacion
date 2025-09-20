
(function(){
  var App = window.App||{};
  var supabase = App.supabase, qs = App.qs, $ = App.$, fmt = App.fmt, WJ = App.WEIGHT_JUDGES, WP = App.WEIGHT_PUBLIC, toast = App.toast;

  var pollId = qs("poll");
  var poll = null;

  function setHeader(){
    document.getElementById("header").style.display = "block";
    document.getElementById("rTitle").textContent = poll.title;
    document.getElementById("rCand").textContent = poll.candidate_name || "";
    if (poll.image_url){ var i=document.getElementById("rPhoto"); i.src=poll.image_url; i.style.display="block"; }
    var open = (poll.is_open !== false);
    document.getElementById("rState").textContent = open ? "Abierta" : "Cerrada";
    document.getElementById("rState").className = "tag " + (open ? "ok" : "bad");
  }

  async function pickOrLoad(){
    if (!pollId){
      document.getElementById("pickPoll").style.display = "block";
      var q = await supabase.from("polls").select("*").order("created_at", {ascending:false});
      var html = (q.data||[]).map(function(p){
        return "<div class='card'>"
          + "<h4>"+p.title+"</h4>"
          + "<p class='small'>"+(p.candidate_name||"")+"</p>"
          + "<button onclick="location.href='results.html?poll="+p.id+"'">Ver resultados</button>"
          + "</div>";
      }).join("");
      document.getElementById("pollList").innerHTML = html || "<p class='small'>No hay encuestas</p>";
      return false;
    }
    var res = await supabase.from("polls").select("*").eq("id", pollId).single();
    if (res.error){ toast("No se encontró la encuesta", "bad"); return false; }
    poll = res.data;
    setHeader();
    document.getElementById("btnShare").onclick = function(){ navigator.clipboard && navigator.clipboard.writeText(location.origin + "/vote.html?poll=" + pollId); };
    document.getElementById("btnOpen").onclick = async function(){
      var upd = await supabase.from("polls").update({ is_open: !(poll.is_open !== false) }).eq("id", pollId);
      if (!upd.error){ toast("Estado actualizado"); } else { toast("No se pudo actualizar", "bad"); }
    };
    return true;
  }

  function render(votes){
    var judges = votes.filter(function(v){ return v.role==="judge"; });
    var publics = votes.filter(function(v){ return v.role==="public"; });
    function avg(arr){ return arr.length ? (arr.reduce(function(s,v){return s+Number(v.score||0)},0)/arr.length) : 0; }

    var aJ = avg(judges), aP = avg(publics);
    document.getElementById("stats").style.display = "grid";
    document.getElementById("lists").style.display = "grid";

    document.getElementById("avgJ").textContent = fmt(aJ);
    document.getElementById("avgP").textContent = fmt(aP);
    document.getElementById("cntJ").textContent = judges.length + " voto(s)";
    document.getElementById("cntP").textContent = publics.length + " voto(s)";
    document.getElementById("barJ").style.width = (aJ/10)*100 + "%";
    document.getElementById("barP").style.width = (aP/10)*100 + "%";

    var total = (aJ*WJ) + (aP*WP);
    document.getElementById("total").textContent = fmt(total);
    document.getElementById("barT").style.width = (total/10)*100 + "%";

    document.getElementById("listJ").innerHTML = judges.map(function(j){ return "<li>Juez <strong>"+j.user_code+"</strong>: "+fmt(j.score)+"</li>"; }).join("") || "<li class='small'>—</li>";
    document.getElementById("listP").innerHTML = publics.map(function(p){ return "<li>"+p.user_code+": "+fmt(p.score)+"</li>"; }).join("") || "<li class='small'>—</li>";
  }

  async function loadVotes(){
    var q = await supabase.from("votes").select("*").eq("poll_id", pollId);
    if (q.error){ console.error(q.error); return; }
    render(q.data||[]);
  }

  function subscribe(){
    supabase.channel("realtime-votes")
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"votes", filter:"poll_id=eq."+pollId }, function(){ loadVotes(); })
      .on("postgres_changes",{ event:"UPDATE", schema:"public", table:"votes", filter:"poll_id=eq."+pollId }, function(){ loadVotes(); })
      .on("postgres_changes",{ event:"DELETE", schema:"public", table:"votes", filter:"poll_id=eq."+pollId }, function(){ loadVotes(); })
      .subscribe();

    supabase.channel("realtime-pollstate")
      .on("postgres_changes",{ event:"UPDATE", schema:"public", table:"polls", filter:"id=eq."+pollId }, function(payload){ poll = payload.new; setHeader(); })
      .subscribe();
  }

  (async function(){
    if (await pickOrLoad()){
      await loadVotes();
      subscribe();
    }
  })();
})();

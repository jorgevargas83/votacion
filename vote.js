
(function(){
  var App = window.App||{};
  var supabase = App.supabase, qs = App.qs, $ = App.$, fmt = App.fmt, toast = App.toast;

  var pollId = new URLSearchParams(location.search).get("poll");
  var userCode = null;
  var finalRole = null;
  var pollObj = null;

  function setStateTag(isOpen){
    var tag = document.getElementById("stateTag");
    tag.textContent = isOpen ? "Abierta" : "Cerrada";
    tag.className = "tag " + (isOpen ? "ok":"bad");
    document.getElementById("check").disabled = !isOpen;
  }

  async function loadPoll(){
    var res = await supabase.from("polls").select("*").eq("id", pollId).single();
    if (res.error || !res.data){ toast("No se encontró la encuesta", "bad"); return false; }
    var poll = res.data; pollObj = poll;
    document.getElementById("title").textContent = poll.title;
    document.getElementById("candidate").textContent = poll.candidate_name || "";
    if (poll.image_url){ var img=document.getElementById("photo"); img.src=poll.image_url; img.style.display="block"; }
    setStateTag(poll.is_open !== false);
    return true;
  }

  function localVotedKey(code){ return "voted_"+pollId+":"+code; }

  document.getElementById("score").addEventListener("input", function(e){
    var v = parseFloat(e.target.value || 0);
    document.getElementById("scoreValue").textContent = fmt(v);
    document.getElementById("scoreBar").style.width = (v/10)*100 + "%";
  });

  document.getElementById("check").onclick = async function(){
    var code = (document.getElementById("code").value||"").trim();
    if (!code) return toast("Ingresa tu carnet", "warn");
    if (pollObj && pollObj.is_open===false) return toast("La encuesta está cerrada", "warn");

    var judge = await supabase.from("poll_judges").select("*").eq("poll_id", pollId).eq("user_id", code).maybeSingle();
    if (judge.error){ toast("Error verificando código", "bad"); return; }

    userCode = code;
    finalRole = judge.data ? "judge" : "public";
    document.getElementById("roleInfo").innerHTML = "Votarás como <span class='tag "+(finalRole==="judge"?"warn":"")+"'>"+(finalRole==="judge"?"JUEZ":"PÚBLICO")+"</span>";

    var existing = await supabase.from("votes").select("id").eq("poll_id", pollId).eq("user_code", userCode).maybeSingle();
    if (existing.data){ toast("Ya has votado en esta encuesta", "warn"); return; }

    if (localStorage.getItem(localVotedKey(userCode))){ toast("Ya votaste desde este dispositivo", "warn"); return; }

    document.getElementById("voteArea").style.display = "block";
  };

  document.getElementById("submitVote").onclick = async function(){
    var score = parseFloat(document.getElementById("score").value);
    if (isNaN(score)) return toast("Selecciona un puntaje", "warn");
    if (pollObj && pollObj.is_open===false) return toast("La encuesta está cerrada", "warn");

    document.getElementById("submitVote").disabled = true;
    try{
      var existing = await supabase.from("votes").select("id").eq("poll_id", pollId).eq("user_code", userCode).maybeSingle();
      if (existing.data){ toast("Ya has votado", "warn"); return; }

      var ins = await supabase.from("votes").insert([{ poll_id: pollId, user_code: userCode, score: score, role: finalRole }]);
      if (ins.error) throw ins.error;

      localStorage.setItem(localVotedKey(userCode), "1");
      toast("Voto registrado ✅", "ok");
      document.getElementById("voteArea").style.display = "none";
    }catch(err){
      console.error(err);
      toast("No se pudo guardar el voto", "bad");
    }finally{
      document.getElementById("submitVote").disabled = false;
    }
  };

  supabase.channel("realtime-polls")
    .on("postgres_changes", { event:"UPDATE", schema:"public", table:"polls", filter:"id=eq."+pollId },
      function(payload){ setStateTag(payload.new.is_open !== false); })
    .subscribe();

  loadPoll();
})();

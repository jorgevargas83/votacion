import { supabase, qs } from "./app.js";

const pollId = qs("poll");
let userCode = null;
let finalRole = null; // judge o public

(async ()=>{
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();
  if(poll){
    document.getElementById("title").textContent = poll.title;
    document.getElementById("candidate").textContent = poll.candidate_name || "";
    if(poll.image_url) document.getElementById("photo").src = poll.image_url;
  }
})();

document.getElementById("check").onclick = async ()=>{
  const code = document.getElementById("code").value.trim();
  if(!code) return alert("Ingresa tu carnet");

  const { data, error } = await supabase.rpc("check_code_for_poll",{ p_poll_id: pollId, p_code: code });
  if(error) return alert(error.message);
  if(!data.ok) return alert(data.message);

  userCode = code;

  if(data.role === "public"){
    finalRole = "public";
    document.getElementById("voteArea").style.display = "block";
  } else {
    // role=judge → mostrar modal
    document.getElementById("modal").style.display = "flex";
    document.getElementById("asJudge").onclick = ()=>{
      if(!data.allowed) return alert("No estás asignado como juez en esta votación");
      finalRole = "judge";
      document.getElementById("modal").style.display = "none";
      document.getElementById("voteArea").style.display = "block";
    };
    document.getElementById("asPublic").onclick = ()=>{
      finalRole = "public";
      document.getElementById("modal").style.display = "none";
      document.getElementById("voteArea").style.display = "block";
    };
  }
};

const slider = document.getElementById("slider");
slider.oninput = ()=> document.getElementById("val").textContent = Number(slider.value).toFixed(1);

document.getElementById("send").onclick = async ()=>{
  if(!userCode || !finalRole) return alert("Falta código o rol");
  const score = Number(slider.value);
  const { data, error } = await supabase.rpc("submit_vote",{ p_poll_id: pollId, p_code: userCode, p_score: score });
  if(error) return alert(error.message);
  if(!data.ok) return alert(data.message);
  alert("¡Voto registrado!");
};

import { supabase, qs, $, fmt, toast } from "./app.js";

const pollId = qs("poll");
let userCode = null;
let pollObj = null;

async function loadPoll(){
  const { data: poll, error } = await supabase.from("polls").select("*").eq("id", pollId).single();
  if (error || !poll){ toast("No se encontró la encuesta", "bad"); return false; }
  pollObj = poll;
  $("#title").textContent = poll.title;
  $("#candidate").textContent = poll.candidate_name || "";
  if (poll.image_url){ const img=$("#photo"); img.src=poll.image_url; img.style.display = "block"; }
  setStateTag(poll.is_open===true);
  return true;
}

function setStateTag(isOpen){
  const tag = $("#stateTag");
  tag.textContent = isOpen ? "Abierta" : "Cerrada";
  tag.className = "tag " + (isOpen ? "ok":"bad");
  $("#check").disabled = !isOpen;
}

$("#score").addEventListener("input", (e)=>{
  const v = parseFloat(e.target.value || 0);
  $("#scoreValue").textContent = fmt(v);
  $("#scoreBar").style.width = ${(v/10)*100}%;
});

$("#check").onclick = async () => {
  const code = $("#code").value.trim();
  if (!code) return toast("Ingresa tu código/carnet", "warn");
  if (!pollObj?.is_open) return toast("La encuesta está cerrada", "warn");

  const { data, error } = await supabase.rpc("check_code_for_poll", { p_poll_id: pollId, p_code: code });
  if (error){ console.error(error); return toast(error.message || "Error verificando código", "bad"); }
  if (!data?.ok) return toast(data?.message || "Código inválido", "bad");

  if (!data.allowed && data.role === "judge") return toast("No estás asignado como juez en este poll", "warn");
  if (data.already_voted) return toast("Este código ya votó", "warn");

  userCode = code;
  $("#roleInfo").innerHTML = Votarás como <span class="tag ${data.role==="judge"?"warn":""}">${data.role==="judge"?"JUEZ":"PÚBLICO"}</span>;
  $("#voteArea").style.display = "block";
};

$("#submitVote").onclick = async () => {
  const score = parseFloat($("#score").value);
  if (Number.isNaN(score)) return toast("Selecciona un puntaje", "warn");
  if (!pollObj?.is_open) return toast("La encuesta está cerrada", "warn");

  $("#submitVote").disabled = true;
  try{
    const { data, error } = await supabase.rpc("submit_vote", { p_poll_id: pollId, p_code: userCode, p_score: score, p_as_public: false });
    if (error) throw error;
    if (!data?.ok) return toast(data?.message || "No se pudo votar", "bad");

    toast("Voto registrado ✅", "ok");
    $("#voteArea").style.display = "none";
  } catch(err){
    console.error(err);
    toast(err?.message || "No se pudo guardar el voto", "bad");
  } finally {
    $("#submitVote").disabled = false;
  }
};

// Realtime: si admin cierra/abre
supabase.channel("realtime-polls")
  .on("postgres_changes", { event:"UPDATE", schema:"public", table:"polls", filter:id=eq.${pollId} },
    payload => { setStateTag(payload.new.is_open===true); })
  .subscribe();

await loadPoll();


import { supabase, qs } from "./app.js";

const pollId = qs("poll");
let userCode = null;
let finalRole = null; // "judge" o "public"

// 1️⃣ Mostrar datos de la encuesta
(async () => {
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (poll) {
    document.getElementById("title").textContent = poll.title;
    document.getElementById("candidate").textContent = poll.candidate_name || "";
    if (poll.image_url) document.getElementById("photo").src = poll.image_url;
  }
})();

// 2️⃣ Validar código de usuario
document.getElementById("check").onclick = async () => {
  // 🔧 Convertir a MAYÚSCULAS
  const code = document.getElementById("code").value.trim().toUpperCase();
  if (!code) return alert("Ingresa tu carnet");

  const { data, error } = await supabase.rpc("check_code_for_poll", {
    p_poll_id: pollId,
    p_code: code
  });

  if (error) return alert(error.message);
  if (!data.ok) return alert(data.message);

  userCode = code;

  if (data.role === "public") {
    finalRole = "public";
    document.getElementById("voteArea").style.display = "block";
  } else {
    // Si es juez -> mostrar modal para elegir
    document.getElementById("modal").style.display = "flex";

    document.getElementById("asJudge").onclick = () => {
      finalRole = "judge";
      document.getElementById("modal").style.display = "none";
      document.getElementById("voteArea").style.display = "block";
    };

    document.getElementById("asPublic").onclick = () => {
      finalRole = "public";
      document.getElementById("modal").style.display = "none";
      document.getElementById("voteArea").style.display = "block";
    };
  }
};

// 3️⃣ Enviar voto
document.getElementById("submitVote").onclick = async () => {
  const score = parseFloat(document.getElementById("score").value);
  if (isNaN(score) || score < 0 || score > 10) {
    return alert("Ingresa un puntaje entre 0 y 10");
  }

  const { data, error } = await supabase.rpc("submit_vote", {
    p_poll_id: pollId,
    p_code: userCode,
    p_score: score,
    p_as_public: finalRole === "public" && data.role === "judge" // permite juez votar como público
  });

  if (error) return alert(error.message);
  if (!data.ok) return alert(data.message);

  alert(`✅ Voto registrado como ${data.role}, puntaje: ${data.score}`);
  document.getElementById("voteArea").style.display = "none";
};

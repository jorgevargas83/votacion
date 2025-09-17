import { supabase, qs } from "./app.js";

const pollId = qs("poll");
let userCode = null;
let finalRole = null;

// ✅ Cargar información de la encuesta
(async () => {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    alert("No se encontró la encuesta");
    return;
  }

  document.getElementById("title").textContent = poll.title;
  document.getElementById("candidate").textContent = poll.candidate_name || "";
  if (poll.image_url) document.getElementById("photo").src = poll.image_url;
})();

document.getElementById("check").onclick = async () => {
  const code = document.getElementById("code").value.trim();
  if (!code) return alert("Ingresa tu carnet");

  // ✅ Verificar si es juez de esta encuesta
  const { data: judge, error: judgeError } = await supabase
    .from("poll_judges")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_id", code)
    .maybeSingle();

  if (judgeError) {
    console.error("Error verificando juez:", judgeError);
    return alert("Error verificando código");
  }

  userCode = code;
  finalRole = judge ? "judge" : "public";

  document.getElementById("voteArea").style.display = "block";
};

document.getElementById("submitVote").onclick = async () => {
  const score = parseFloat(document.getElementById("score").value);
  if (isNaN(score)) return alert("Selecciona un puntaje");

  // ✅ Verificar si ya existe un voto para este usuario en esta encuesta
  const { data: existingVote, error: existingError } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_code", userCode)
    .maybeSingle();

  if (existingError) {
    console.error("Error verificando voto previo:", existingError);
    return alert("Error verificando si ya votaste");
  }

  if (existingVote) {
    alert("Ya has votado en esta encuesta");
    return;
  }

  // ✅ Insertar voto si no existe previo
  const { error: voteError } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_code: userCode,
      score,
      role: finalRole
    }
  ]);

  if (voteError) {
    console.error("Error guardando voto:", voteError);
    alert("No se pudo guardar el voto");
  } else {
    alert("✅ Voto registrado con éxito");
    document.getElementById("voteArea").style.display = "none"; // Oculta área de votación
  }
};

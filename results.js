import { supabase } from "./app.js";

const urlParams = new URLSearchParams(window.location.search);
const pollId = urlParams.get("poll");
const container = document.getElementById("results");

async function fetchResults() {
  // Obtener votos con detalle de usuario
  const { data: votes } = await supabase
    .from("votes")
    .select("score, role, user_id, users(name, code)")
    .eq("poll_id", pollId);

  if (!votes) return;

  // Separar jueces y público
  const judges = votes.filter(v => v.role === "judge");
  const publicVotes = votes.filter(v => v.role === "public");

  // Mostrar resultados
  container.innerHTML = `
    <h2>Resultados en tiempo real</h2>
    <h3>Jueces</h3>
    <ul>
      ${judges.map(j => `<li>${j.users?.name || j.users?.code}: <b>${j.score}</b></li>`).join("")}
    </ul>
    <h3>Promedio del Público</h3>
    <p><b>${
      publicVotes.length > 0
        ? (publicVotes.reduce((sum, v) => sum + parseFloat(v.score), 0) / publicVotes.length).toFixed(2)
        : "0.00"
    }</b> (${publicVotes.length} votos)</p>
    <h3>Total acumulado</h3>
    <p><b>${(
      judges.reduce((s, v) => s + parseFloat(v.score), 0) +
      (publicVotes.length > 0
        ? (publicVotes.reduce((sum, v) => sum + parseFloat(v.score), 0) / publicVotes.length)
        : 0)
    ).toFixed(2)} / 40</b></p>
  `;
}

// Actualizar cada 3 segundos
setInterval(fetchResults, 3000);
fetchResults();

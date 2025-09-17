import { supabase, qs } from "./app.js";

const pollId = qs("poll");
const container = document.getElementById("results");

async function fetchResults() {
  // Obtener votos con detalle de usuario
  const { data: votes, error } = await supabase
    .from("votes")
    .select("score, role, users(name, code)")
    .eq("poll_id", pollId);

  if (error) {
    console.error(error);
    container.innerHTML = `<p>Error cargando resultados</p>`;
    return;
  }

  if (!votes || votes.length === 0) {
    container.innerHTML = `<p>No hay votos todavía</p>`;
    return;
  }

  const judges = votes.filter(v => v.role === "judge");
  const publicVotes = votes.filter(v => v.role === "public");

  // Construcción dinámica de tarjetas
  let html = "";

  // Jueces
  html += judges
    .map(j => {
      return `
        <div class="card judge-card">
          <h3>${j.users?.name || j.users?.code}</h3>
          <div class="score">${parseFloat(j.score).toFixed(1)}</div>
        </div>
      `;
    })
    .join("");

  // Promedio público
  const publicAvg =
    publicVotes.length > 0
      ? publicVotes.reduce((s, v) => s + parseFloat(v.score), 0) /
        publicVotes.length
      : 0;

  html += `
    <div class="card public-card">
      <h3>Promedio Público</h3>
      <div class="score">${publicAvg.toFixed(1)}</div>
      <p>(${publicVotes.length} votos)</p>
    </div>
  `;

  // Total acumulado
  const total =
    judges.reduce((s, v) => s + parseFloat(v.score), 0) + publicAvg;

  html += `
    <div class="total">
      Total Acumulado: ${total.toFixed(1)} / 40
    </div>
  `;

  container.innerHTML = html;
}

// Actualizar resultados cada 3 segundos
setInterval(fetchResults, 3000);
fetchResults();

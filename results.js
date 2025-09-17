import { supabase, qs } from "./app.js";

const pollId = qs("poll");

async function loadResults() {
  const { data: votes, error } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId);

  if (error) {
    console.error("Error cargando resultados:", error);
    return;
  }

  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!votes || votes.length === 0) {
    container.textContent = "No hay votos todavía";
    return;
  }

  const judges = votes.filter(v => v.role === "judge");
  const publics = votes.filter(v => v.role === "public");

  const avg = arr =>
    arr.length > 0
      ? (arr.reduce((sum, v) => sum + v.score, 0) / arr.length).toFixed(2)
      : "0.00";

  container.innerHTML = `
    <h3>Resultados</h3>
    <p><strong>Promedio jueces:</strong> ${avg(judges)}</p>
    <ul>
      ${judges
        .map(j => `<li>Juez ${j.user_code}: ${j.score}</li>`)
        .join("")}
    </ul>
    <p><strong>Promedio público:</strong> ${avg(publics)}</p>
    <p><strong>Total votos:</strong> ${votes.length}</p>
  `;
}

// ✅ Escucha en tiempo real para actualizar sin refrescar
supabase
  .channel("realtime-votes")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "votes", filter: `poll_id=eq.${pollId}` },
    payload => {
      console.log("Nuevo voto recibido:", payload.new);
      loadResults();
    }
  )
  .subscribe();

loadResults();

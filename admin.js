
import { supabase } from "./app.js";

// Referencias a elementos del DOM
const createBtn = document.getElementById("create");
const titleInput = document.getElementById("title");
const candidateInput = document.getElementById("candidate");
const imageInput = document.getElementById("image");
const judgesInput = document.getElementById("judges");
const qrDiv = document.getElementById("qr");
const resultsBtn = document.getElementById("resultsBtn");

createBtn.onclick = async () => {
  try {
    const title = titleInput.value.trim();
    const candidate = candidateInput.value.trim();
    const image = imageInput.value.trim();

    if (!title) return alert("Por favor ingresa un título");

    // ✅ Convertir jueces a mayúsculas y limpiar espacios
    const judges = judgesInput.value
      .split(",")
      .map(j => j.trim().toUpperCase())
      .filter(Boolean);

    // 1️⃣ Crear la encuesta
    const { data: poll, error } = await supabase
      .from("polls")
      .insert([{ title, candidate_name: candidate, image_url: image }])
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Asignar jueces a poll_judges
    for (const code of judges) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!user) {
        console.warn(`⚠ No se encontró el juez con código ${code}`);
        continue;
      }

      const { error: insertError } = await supabase
        .from("poll_judges")
        .insert([{ poll_id: poll.id, user_id: user.id }]);

      if (insertError) console.error(insertError);
    }

    // 3️⃣ Generar QR de votación
    const url = `${window.location.origin}/vote.html?poll=${poll.id}`;
    qrDiv.innerHTML = ""; // limpiar
    const canvas = document.createElement("canvas");
    qrDiv.appendChild(canvas);
    QRCode.toCanvas(canvas, url, { width: 200 }, (err) => {
      if (err) console.error(err);
      console.log("QR generado:", url);
    });

    // ✅ Mostrar botón de resultados en vivo
    if (resultsBtn) {
      resultsBtn.style.display = "block";
      resultsBtn.onclick = () => {
        window.open(`results.html?poll=${poll.id}`, "_blank");
      };
    }

  } catch (err) {
    console.error("Error general:", err);
    alert("Hubo un problema creando la encuesta");
  }
};

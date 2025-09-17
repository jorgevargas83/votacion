import { supabase } from "./app.js";

const titleInput = document.getElementById("title");
const candidateInput = document.getElementById("candidate");
const imageInput = document.getElementById("image");
const judgesInput = document.getElementById("judges");
const createBtn = document.getElementById("createPoll");
const qrContainer = document.getElementById("qrContainer");
const resultsBtn = document.getElementById("viewResultsBtn");

createBtn.onclick = async () => {
  try {
    const title = titleInput.value.trim();
    const candidate = candidateInput.value.trim();
    const image = imageInput.value.trim();

    if (!title) return alert("El título es obligatorio");

    // Crear encuesta en la BD
    const { data, error } = await supabase
      .from("polls")
      .insert([
        {
          title,
          candidate_name: candidate || null,
          image_url: image || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando encuesta:", error);
      alert("Hubo un problema creando la encuesta.");
      return;
    }

    console.log("Encuesta creada:", data);

    // Generar QR
    const pollUrl = `${window.location.origin}/vote.html?poll=${data.id}`;
    console.log("QR generado:", pollUrl);

    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: pollUrl,
      width: 256,
      height: 256
    });

    // 🔧 AHORA el botón usa el ID correcto porque estamos dentro del mismo bloque
    resultsBtn.style.display = "inline-block";
    resultsBtn.onclick = () => {
      window.location.href = `results.html?poll=${data.id}`;
    };

  } catch (err) {
    console.error("Error general:", err);
    alert("Hubo un problema inesperado.");
  }
};
